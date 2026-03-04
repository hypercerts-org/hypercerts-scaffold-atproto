"use server";
import { getRepoContext } from "@/lib/repo-context";
import { resolveRecordBlobs } from "./blob-utils";
import { parseAtUri } from "@/lib/utils";
import {
  resolveStrongRef,
  processLocations,
  type StrongRef,
} from "./atproto-writes";
import type { CertifiedActorProfile } from "@/lib/types";
import {
  OrgHypercertsClaimContribution as OrgHypercertsClaimContributionDetails,
  OrgHypercertsClaimContributorInformation,
  OrgHypercertsContextEvaluation as OrgHypercertsClaimEvaluation,
  OrgHypercertsContextMeasurement as OrgHypercertsClaimMeasurement,
  OrgHypercertsClaimActivity,
} from "@hypercerts-org/lexicon";
import { assertValidRecord } from "@/lib/record-validation";

export type RepositoryRole = "admin" | "writer" | "reader";
import { cookies } from "next/headers";
import { getSession } from "./atproto-session";
import oauthClient from "./hypercerts-sdk";

export interface GrantAccessParams {
  repoDid: string;
  userDid: string;
  role: RepositoryRole;
}

export interface ActiveProfileInfo {
  name: string | undefined;
  handle: string | undefined;
  isOrganization: boolean;
}

export interface SerializedRecord {
  uri: string;
  cid: string;
  value: Record<string, unknown>;
}

export const getActiveProfileInfo =
  async (): Promise<ActiveProfileInfo | null> => {
    const ctx = await getRepoContext();
    if (!ctx) return null;

    const profileResult = await ctx.agent.com.atproto.repo
      .getRecord({
        repo: ctx.targetDid,
        collection: "app.certified.actor.profile",
        rkey: "self",
      })
      .catch(() => null);
    const profile = profileResult?.data?.value as
      | CertifiedActorProfile
      | undefined;
    if (!profile) return null;
    return {
      name: profile.displayName || profile.handle,
      handle: profile.handle,
      isOrganization: false,
    };
  };
export const switchActiveProfile = async (did: string): Promise<void> => {
  const cookiePromise = cookies();
  const session = await getSession();
  if (!session) {
    throw new Error(
      "Cannot switch profiles: no active session found. Please log in first.",
    );
  }

  const cookieStore = await cookiePromise;
  cookieStore.set("active-did", did, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

export const logout = async (): Promise<void> => {
  const session = await getSession();
  if (!session) {
    return;
  }
  oauthClient.revoke(session.sub);
};

export const addContribution = async (params: {
  hypercertUri: string;
  contributors: string[];
  contributionDetails: {
    role: string;
    contributionDescription?: string;
    startDate?: string;
    endDate?: string;
  };
}): Promise<{ uri: string; cid: string }> => {
  const ctx = await getRepoContext();
  if (!ctx) {
    throw new Error(
      "addContribution failed: could not establish repository context.",
    );
  }

  // 1. Parse and validate the hypercertUri before any writes
  const hypercertParsed = parseAtUri(params.hypercertUri);
  if (
    !hypercertParsed ||
    !hypercertParsed.collection ||
    !hypercertParsed.rkey
  ) {
    throw new Error("addContribution failed: invalid hypercertUri.");
  }

  // 2. Ownership check — must happen before any child record writes
  if (hypercertParsed.did !== ctx.activeDid) {
    throw new Error(
      "addContribution failed: cannot modify another user's hypercert.",
    );
  }

  // 3. Fetch the existing hypercert record before creating child records
  const existingHypercertResult = await ctx.agent.com.atproto.repo.getRecord({
    repo: hypercertParsed.did,
    collection: hypercertParsed.collection,
    rkey: hypercertParsed.rkey,
  });
  const existingRecord = existingHypercertResult.data.value as Record<
    string,
    unknown
  >;

  // 4. Create contributionDetails record
  const detailsRecord: OrgHypercertsClaimContributionDetails.Record = {
    $type: "org.hypercerts.claim.contribution",
    role: params.contributionDetails.role,
    createdAt: new Date().toISOString(),
    ...(params.contributionDetails.contributionDescription
      ? {
          contributionDescription:
            params.contributionDetails.contributionDescription,
        }
      : {}),
    ...(params.contributionDetails.startDate
      ? { startDate: params.contributionDetails.startDate }
      : {}),
    ...(params.contributionDetails.endDate
      ? { endDate: params.contributionDetails.endDate }
      : {}),
  };

  assertValidRecord(
    "contributionDetails",
    detailsRecord,
    OrgHypercertsClaimContributionDetails.validateRecord,
  );
  const detailsResult = await ctx.agent.com.atproto.repo.createRecord({
    repo: ctx.activeDid,
    collection: "org.hypercerts.claim.contribution",
    record: detailsRecord,
  });
  const detailsRef = {
    uri: detailsResult.data.uri,
    cid: detailsResult.data.cid,
  };

  // 5. Create contributorInformation records for each contributor
  const contributorRefs = await Promise.all(
    params.contributors.map(async (identifier) => {
      const infoRecord: OrgHypercertsClaimContributorInformation.Record = {
        $type: "org.hypercerts.claim.contributorInformation",
        identifier,
        createdAt: new Date().toISOString(),
      };
      assertValidRecord(
        "contributorInformation",
        infoRecord,
        OrgHypercertsClaimContributorInformation.validateRecord,
      );
      const infoResult = await ctx.agent.com.atproto.repo.createRecord({
        repo: ctx.activeDid,
        collection: "org.hypercerts.claim.contributorInformation",
        record: infoRecord,
      });
      return { uri: infoResult.data.uri, cid: infoResult.data.cid };
    }),
  );

  // Build new contributor entries
  const newContributors = contributorRefs.map((ref) => ({
    contributorIdentity: {
      $type: "com.atproto.repo.strongRef" as const,
      ...ref,
    },
    contributionDetails: {
      $type: "com.atproto.repo.strongRef" as const,
      ...detailsRef,
    },
  }));

  const existingContributors = (existingRecord.contributors as unknown[]) || [];
  existingRecord.contributors = [...existingContributors, ...newContributors];

  // 6. Update hypercert with appended contributors
  assertValidRecord(
    "activity",
    existingRecord,
    OrgHypercertsClaimActivity.validateRecord,
  );
  const updateResult = await ctx.agent.com.atproto.repo.putRecord({
    repo: ctx.activeDid,
    collection: hypercertParsed.collection,
    rkey: hypercertParsed.rkey,
    record: existingRecord,
  });

  return { uri: updateResult.data.uri, cid: updateResult.data.cid };
};

export const addEvaluation = async (params: {
  hypercertUri: string;
  evaluators: string[];
  summary: string;
  score?: { min: number; max: number; value: number };
  content?: string[];
  measurements?: string[];
  location?: string;
}): Promise<{ uri: string; cid: string }> => {
  const ctx = await getRepoContext();
  if (!ctx) {
    throw new Error(
      "addEvaluation failed: could not establish repository context. The user session may have expired or the target DID is unreachable.",
    );
  }

  const { hypercertUri, ...evaluationData } = params;

  // Resolve subject hypercert to StrongRef
  const subject = await resolveStrongRef(
    ctx.agent,
    hypercertUri,
    "org.hypercerts.claim.activity",
  );

  // Resolve measurements AT-URIs to StrongRefs
  const measurementRefs = evaluationData.measurements
    ? await Promise.all(
        evaluationData.measurements.map((uri) =>
          resolveStrongRef(
            ctx.agent,
            uri,
            "org.hypercerts.context.measurement",
          ),
        ),
      )
    : undefined;

  // Resolve location AT-URI to StrongRef
  const locationRef = evaluationData.location
    ? await resolveStrongRef(
        ctx.agent,
        evaluationData.location,
        "app.certified.location",
      )
    : undefined;

  const record: OrgHypercertsClaimEvaluation.Record = {
    $type: "org.hypercerts.context.evaluation",
    subject,
    evaluators: evaluationData.evaluators.map((did) => ({ did })),
    summary: evaluationData.summary,
    createdAt: new Date().toISOString(),
    ...(evaluationData.score ? { score: evaluationData.score } : {}),
    ...(evaluationData.content
      ? {
          content: evaluationData.content.map((uri) => ({
            $type: "org.hypercerts.defs#uri" as const,
            uri,
          })),
        }
      : {}),
    ...(measurementRefs ? { measurements: measurementRefs } : {}),
    ...(locationRef ? { location: locationRef } : {}),
  };

  assertValidRecord(
    "evaluation",
    record,
    OrgHypercertsClaimEvaluation.validateRecord,
  );
  const result = await ctx.agent.com.atproto.repo.createRecord({
    repo: ctx.activeDid,
    collection: "org.hypercerts.context.evaluation",
    record,
  });

  return { uri: result.data.uri, cid: result.data.cid };
};

// Location parameter for measurements - can be a string (AT-URI) or full location creation params
export type MeasurementLocationParam =
  | string
  | {
      lpVersion: string;
      srs: string;
      locationType: string;
      location: string | File;
      name?: string;
      description?: string;
    };

export const addMeasurement = async (params: {
  subject: string;
  metric: string;
  value: string;
  unit: string;
  measurers?: string[];
  startDate?: string;
  endDate?: string;
  methodType?: string;
  methodURI?: string;
  evidenceURI?: string[];
  locations?: MeasurementLocationParam[];
  comment?: string;
}): Promise<{ uri: string; cid: string }> => {
  const ctx = await getRepoContext();
  if (!ctx) {
    throw new Error(
      "addMeasurement failed: could not establish repository context. The user session may have expired or the target DID is unreachable.",
    );
  }

  // Resolve subject to StrongRef
  const subject = await resolveStrongRef(
    ctx.agent,
    params.subject,
    "org.hypercerts.claim.activity",
  );

  // Process locations if provided
  let locationRefs: StrongRef[] | undefined;
  if (params.locations && params.locations.length > 0) {
    locationRefs = await processLocations(
      ctx.agent,
      ctx.activeDid,
      params.locations,
    );
  }

  const record: OrgHypercertsClaimMeasurement.Record = {
    $type: "org.hypercerts.context.measurement",
    subjects: [subject],
    metric: params.metric,
    value: params.value,
    unit: params.unit,
    createdAt: new Date().toISOString(),
    ...(params.measurers?.length
      ? { measurers: params.measurers.map((did) => ({ did })) }
      : {}),
    ...(params.startDate ? { startDate: params.startDate } : {}),
    ...(params.endDate ? { endDate: params.endDate } : {}),
    ...(params.methodType ? { methodType: params.methodType } : {}),
    ...(params.methodURI ? { methodURI: params.methodURI } : {}),
    ...(params.evidenceURI?.length ? { evidenceURI: params.evidenceURI } : {}),
    ...(params.comment ? { comment: params.comment } : {}),
    ...(locationRefs?.length ? { locations: locationRefs } : {}),
  };

  assertValidRecord(
    "measurement",
    record,
    OrgHypercertsClaimMeasurement.validateRecord,
  );
  const result = await ctx.agent.com.atproto.repo.createRecord({
    repo: ctx.activeDid,
    collection: "org.hypercerts.context.measurement",
    record,
  });

  return { uri: result.data.uri, cid: result.data.cid };
};

export const getMeasurementRecord = async (params: {
  did: string;
  collection: string;
  rkey: string;
}): Promise<SerializedRecord> => {
  const { did, collection, rkey } = params;
  const ctx = await getRepoContext({ targetDid: did });
  if (!ctx) {
    throw new Error(
      "getMeasurementRecord failed: could not establish repository context. The user session may have expired or the target DID is unreachable.",
    );
  }

  const result = await ctx.agent.com.atproto.repo.getRecord({
    repo: did,
    collection,
    rkey,
  });
  const data: Record<string, unknown> = { ...result.data };
  if (data?.value) {
    data.value = await resolveRecordBlobs(data.value, did);
  }
  return JSON.parse(JSON.stringify(data)) as SerializedRecord;
};

export const getEvaluationRecord = async (params: {
  did: string;
  collection: string;
  rkey: string;
}): Promise<SerializedRecord> => {
  const { did, collection, rkey } = params;
  const ctx = await getRepoContext({ targetDid: did });
  if (!ctx) {
    throw new Error(
      "getEvaluationRecord failed: could not establish repository context. The user session may have expired or the target DID is unreachable.",
    );
  }

  const result = await ctx.agent.com.atproto.repo.getRecord({
    repo: did,
    collection,
    rkey,
  });
  const data: Record<string, unknown> = { ...result.data };
  if (data?.value) {
    data.value = await resolveRecordBlobs(data.value, did);
  }
  return JSON.parse(JSON.stringify(data)) as SerializedRecord;
};

export const getEvidenceRecord = async (params: {
  did: string;
  collection: string;
  rkey: string;
}): Promise<SerializedRecord> => {
  const { did, collection, rkey } = params;
  const ctx = await getRepoContext({ targetDid: did });
  if (!ctx) {
    throw new Error(
      "getEvidenceRecord failed: could not establish repository context. The user session may have expired or the target DID is unreachable.",
    );
  }

  const result = await ctx.agent.com.atproto.repo.getRecord({
    repo: did,
    collection,
    rkey,
  });
  const data: Record<string, unknown> = { ...result.data };
  if (data?.value) {
    data.value = await resolveRecordBlobs(data.value, did);
  }
  return JSON.parse(JSON.stringify(data)) as SerializedRecord;
};

export const getContributorInformationRecord = async (params: {
  did: string;
  collection: string;
  rkey: string;
}): Promise<SerializedRecord> => {
  const { did, collection, rkey } = params;
  const ctx = await getRepoContext({ targetDid: did });
  if (!ctx) {
    throw new Error(
      "getContributorInformationRecord failed: could not establish repository context. The user session may have expired or the target DID is unreachable.",
    );
  }
  const result = await ctx.agent.com.atproto.repo.getRecord({
    repo: did,
    collection,
    rkey,
  });
  const data: Record<string, unknown> = { ...result.data };
  if (data?.value) {
    data.value = await resolveRecordBlobs(data.value, did);
  }
  return JSON.parse(JSON.stringify(data)) as SerializedRecord;
};

export const deleteHypercert = async (params: {
  hypercertUri: string;
}): Promise<{ success: true }> => {
  const ctx = await getRepoContext();
  if (!ctx) {
    throw new Error(
      "deleteHypercert failed: could not establish repository context. The user session may have expired or the target DID is unreachable.",
    );
  }
  const parsed = parseAtUri(params.hypercertUri);
  if (!parsed) {
    throw new Error("deleteHypercert failed: invalid hypercertUri.");
  }
  if (parsed.did !== ctx.activeDid) {
    throw new Error(
      "deleteHypercert failed: Forbidden — URI DID does not match active session DID.",
    );
  }
  await ctx.agent.com.atproto.repo.deleteRecord({
    repo: ctx.activeDid,
    collection: parsed.collection || "org.hypercerts.claim.activity",
    rkey: parsed.rkey,
  });
  return { success: true };
};

export const updateMeasurement = async (params: {
  measurementUri: string;
  updates: {
    metric?: string;
    value?: string;
    unit?: string;
    measurers?: string[];
    startDate?: string;
    endDate?: string;
    methodType?: string;
    methodURI?: string;
    evidenceURI?: string[];
    comment?: string;
  };
}): Promise<{ uri: string; cid: string }> => {
  const ctx = await getRepoContext();
  if (!ctx) {
    throw new Error(
      "updateMeasurement failed: could not establish repository context.",
    );
  }
  // Defense-in-depth: ATProto scoped repos already prevent cross-repo writes,
  // but we validate the DID for consistency with deleteRecord/deleteHypercert
  // and to surface clear errors on mismatched URIs.
  const parsed = parseAtUri(params.measurementUri);
  if (!parsed || !parsed.collection || !parsed.rkey) {
    throw new Error("updateMeasurement failed: invalid AT-URI format");
  }
  if (parsed.did !== ctx.activeDid) {
    throw new Error(
      "updateMeasurement failed: Forbidden — URI DID does not match active session DID.",
    );
  }
  // Fetch existing measurement
  const existingResult = await ctx.agent.com.atproto.repo.getRecord({
    repo: parsed.did,
    collection: parsed.collection || "org.hypercerts.context.measurement",
    rkey: parsed.rkey,
  });
  const existing = existingResult.data
    .value as OrgHypercertsClaimMeasurement.Record & {
    subject?: OrgHypercertsClaimMeasurement.Record["subjects"] extends
      | (infer T)[]
      | undefined
      ? T
      : never;
  };

  // Preserve existing subjects, or migrate from old singular subject field
  const existingSubjects =
    existing.subjects ?? (existing.subject ? [existing.subject] : undefined);

  // Merge updates, preserving immutable fields
  const record: OrgHypercertsClaimMeasurement.Record = {
    ...existing,
    $type: "org.hypercerts.context.measurement",
    ...(existingSubjects !== undefined ? { subjects: existingSubjects } : {}),
  };

  // Apply individual updates
  const updates = params.updates;
  if (updates.metric !== undefined) record.metric = updates.metric;
  if (updates.value !== undefined) record.value = updates.value;
  if (updates.unit !== undefined) record.unit = updates.unit;
  if (updates.startDate !== undefined) record.startDate = updates.startDate;
  if (updates.endDate !== undefined) record.endDate = updates.endDate;
  if (updates.methodType !== undefined) record.methodType = updates.methodType;
  if (updates.methodURI !== undefined) record.methodURI = updates.methodURI;
  if (updates.evidenceURI !== undefined)
    record.evidenceURI = updates.evidenceURI;
  if (updates.comment !== undefined) record.comment = updates.comment;
  if (updates.measurers !== undefined) {
    record.measurers = updates.measurers.map((did) => ({ did }));
  }

  assertValidRecord(
    "measurement",
    record,
    OrgHypercertsClaimMeasurement.validateRecord,
  );
  const result = await ctx.agent.com.atproto.repo.putRecord({
    repo: ctx.activeDid,
    collection: parsed.collection || "org.hypercerts.context.measurement",
    rkey: parsed.rkey,
    record,
  });

  return { uri: result.data.uri, cid: result.data.cid };
};

export const deleteRecord = async (params: {
  recordUri: string;
}): Promise<{ success: true }> => {
  const ctx = await getRepoContext();
  if (!ctx) {
    throw new Error(
      "deleteRecord failed: could not establish repository context.",
    );
  }
  const parsed = parseAtUri(params.recordUri);
  if (!parsed || !parsed.collection || !parsed.rkey) {
    throw new Error("deleteRecord failed: invalid AT-URI format");
  }
  if (parsed.did !== ctx.activeDid) {
    throw new Error(
      "deleteRecord failed: Forbidden — URI DID does not match active session DID.",
    );
  }
  await ctx.agent.com.atproto.repo.deleteRecord({
    repo: ctx.activeDid,
    collection: parsed.collection,
    rkey: parsed.rkey,
  });
  return { success: true };
};
