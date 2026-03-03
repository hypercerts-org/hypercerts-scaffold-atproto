"use server";
import { getRepoContext } from "@/lib/repo-context";
import { resolveRecordBlobs } from "./blob-utils";
import { parseAtUri } from "@/lib/utils";
import {
  resolveStrongRef,
  processLocations,
  type StrongRef,
} from "./atproto-writes";

export type RepositoryRole = "admin" | "writer" | "reader";
import { cookies } from "next/headers";
import { getSession } from "./atproto-session";
import oauthClient from "./hypercerts-sdk";

export interface GrantAccessParams {
  repoDid: string;
  userDid: string;
  role: RepositoryRole;
}
export const getActiveProfileInfo = async () => {
  const ctx = await getRepoContext();
  if (!ctx) return null;

  const profileResult = await ctx.agent.com.atproto.repo
    .getRecord({
      repo: ctx.targetDid,
      collection: "app.certified.actor.profile",
      rkey: "self",
    })
    .catch(() => null);
  const profile =
    (profileResult?.data?.value as Record<string, unknown> | null) ?? null;
  if (!profile) return null;
  return {
    name:
      (profile.displayName as string | undefined) ||
      (profile.handle as string | undefined),
    handle: profile.handle as string | undefined,
    isOrganization: false,
  };
};
export const switchActiveProfile = async (did: string) => {
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

export const logout = async () => {
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
}) => {
  const ctx = await getRepoContext();
  if (!ctx) {
    throw new Error(
      "addContribution failed: could not establish repository context.",
    );
  }

  // 1. Create contributionDetails record
  const detailsRecord: Record<string, unknown> = {
    $type: "org.hypercerts.claim.contributionDetails",
    role: params.contributionDetails.role,
    createdAt: new Date().toISOString(),
  };
  if (params.contributionDetails.contributionDescription) {
    detailsRecord.contributionDescription =
      params.contributionDetails.contributionDescription;
  }
  if (params.contributionDetails.startDate)
    detailsRecord.startDate = params.contributionDetails.startDate;
  if (params.contributionDetails.endDate)
    detailsRecord.endDate = params.contributionDetails.endDate;

  const detailsResult = await ctx.agent.com.atproto.repo.createRecord({
    repo: ctx.activeDid,
    collection: "org.hypercerts.claim.contributionDetails",
    record: detailsRecord,
  });
  const detailsRef = {
    uri: detailsResult.data.uri,
    cid: detailsResult.data.cid,
  };

  // 2. Create contributorInformation records for each contributor
  const contributorRefs = await Promise.all(
    params.contributors.map(async (identifier) => {
      const infoRecord: Record<string, unknown> = {
        $type: "org.hypercerts.claim.contributorInformation",
        identifier,
        createdAt: new Date().toISOString(),
      };
      const infoResult = await ctx.agent.com.atproto.repo.createRecord({
        repo: ctx.activeDid,
        collection: "org.hypercerts.claim.contributorInformation",
        record: infoRecord,
      });
      return { uri: infoResult.data.uri, cid: infoResult.data.cid };
    }),
  );

  // 3. Fetch existing hypercert and append contributors
  await resolveStrongRef(
    ctx.agent,
    params.hypercertUri,
    "org.hypercerts.claim.activity",
  );
  const hypercertParsed = parseAtUri(params.hypercertUri);
  if (!hypercertParsed) throw new Error("Invalid hypercertUri");

  const existingHypercertResult = await ctx.agent.com.atproto.repo.getRecord({
    repo: hypercertParsed.did,
    collection: hypercertParsed.collection || "org.hypercerts.claim.activity",
    rkey: hypercertParsed.rkey,
  });
  const existingRecord = existingHypercertResult.data.value as Record<
    string,
    unknown
  >;

  // Build new contributor entries
  const newContributors = contributorRefs.map((ref) => ({
    contributorIdentity: ref,
    contributionDetails: detailsRef,
  }));

  const existingContributors = (existingRecord.contributors as unknown[]) || [];
  existingRecord.contributors = [...existingContributors, ...newContributors];

  // 4. Update hypercert with appended contributors
  const updateResult = await ctx.agent.com.atproto.repo.putRecord({
    repo: ctx.activeDid,
    collection: hypercertParsed.collection || "org.hypercerts.claim.activity",
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
}) => {
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

  const record: Record<string, unknown> = {
    $type: "org.hypercerts.claim.evaluation",
    subject,
    evaluators: evaluationData.evaluators.map((did) => ({ did })),
    summary: evaluationData.summary,
    createdAt: new Date().toISOString(),
  };
  if (evaluationData.score) record.score = evaluationData.score;
  if (evaluationData.content) record.content = evaluationData.content;
  if (evaluationData.measurements)
    record.measurements = evaluationData.measurements;
  if (evaluationData.location) record.location = evaluationData.location;

  const result = await ctx.agent.com.atproto.repo.createRecord({
    repo: ctx.activeDid,
    collection: "org.hypercerts.claim.evaluation",
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
}) => {
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

  const record: Record<string, unknown> = {
    $type: "org.hypercerts.claim.measurement",
    subject,
    metric: params.metric,
    value: params.value,
    unit: params.unit,
    createdAt: new Date().toISOString(),
  };
  if (params.measurers?.length)
    record.measurers = params.measurers.map((did) => ({ did }));
  if (params.startDate) record.startDate = params.startDate;
  if (params.endDate) record.endDate = params.endDate;
  if (params.methodType) record.methodType = params.methodType;
  if (params.methodURI) record.methodURI = params.methodURI;
  if (params.evidenceURI?.length) record.evidenceURI = params.evidenceURI;
  if (params.comment) record.comment = params.comment;
  if (locationRefs?.length) record.locations = locationRefs;

  const result = await ctx.agent.com.atproto.repo.createRecord({
    repo: ctx.activeDid,
    collection: "org.hypercerts.claim.measurement",
    record,
  });

  return { uri: result.data.uri, cid: result.data.cid };
};

export const getMeasurementRecord = async (params: {
  did: string;
  collection: string;
  rkey: string;
}) => {
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
  return JSON.parse(JSON.stringify(data));
};

export const getEvaluationRecord = async (params: {
  did: string;
  collection: string;
  rkey: string;
}) => {
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
  return JSON.parse(JSON.stringify(data));
};

export const getEvidenceRecord = async (params: {
  did: string;
  collection: string;
  rkey: string;
}) => {
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
  return JSON.parse(JSON.stringify(data));
};

export const getContributorInformationRecord = async (params: {
  did: string;
  collection: string;
  rkey: string;
}) => {
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
  return JSON.parse(JSON.stringify(data));
};

export const deleteHypercert = async (params: { hypercertUri: string }) => {
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
}) => {
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
    collection: parsed.collection || "org.hypercerts.claim.measurement",
    rkey: parsed.rkey,
  });
  const existing = existingResult.data.value as Record<string, unknown>;

  // Merge updates, preserving immutable fields
  const record: Record<string, unknown> = {
    ...existing,
    $type: "org.hypercerts.claim.measurement",
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

  const result = await ctx.agent.com.atproto.repo.putRecord({
    repo: ctx.activeDid,
    collection: parsed.collection || "org.hypercerts.claim.measurement",
    rkey: parsed.rkey,
    record,
  });

  return { uri: result.data.uri, cid: result.data.cid };
};

export const deleteRecord = async (params: { recordUri: string }) => {
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
