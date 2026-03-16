"use server";
import { getRepoContext } from "@/lib/repo-context";
import { resolveRecordBlobs } from "./blob-utils";
import { parseAtUri } from "@/lib/utils";
import {
  resolveStrongRef,
  processLocations,
  type StrongRef,
} from "./atproto-writes";
import {
  AppCertifiedActorProfile,
  OrgHypercertsContextEvaluation,
  OrgHypercertsContextMeasurement,
} from "@hypercerts-org/lexicon";
import { assertValidRecord } from "@/lib/record-validation";
import { processContributions } from "@/lib/contribution-helpers";

import { getAgent, resolveHandle } from "./atproto-session";

export interface ActiveProfileInfo {
  name: string | undefined;
  handle: string | undefined;
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
        repo: ctx.userDid,
        collection: "app.certified.actor.profile",
        rkey: "self",
      })
      .catch(() => null);
    const profile = profileResult?.data?.value as
      | AppCertifiedActorProfile.Record
      | undefined;
    if (!profile) return null;
    const handle = await resolveHandle(ctx.agent, ctx.userDid);
    return {
      name: profile.displayName || handle,
      handle,
    };
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

  const result = await processContributions(ctx, params.hypercertUri, [
    {
      contributors: params.contributors,
      role: params.contributionDetails.role,
      contributionDescription:
        params.contributionDetails.contributionDescription,
      startDate: params.contributionDetails.startDate,
      endDate: params.contributionDetails.endDate,
    },
  ]);

  return result;
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

  const record: OrgHypercertsContextEvaluation.Record = {
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
    OrgHypercertsContextEvaluation.validateRecord,
  );
  const result = await ctx.agent.com.atproto.repo.createRecord({
    repo: ctx.userDid,
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
      ctx.userDid,
      params.locations,
    );
  }

  const record: OrgHypercertsContextMeasurement.Record = {
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
    OrgHypercertsContextMeasurement.validateRecord,
  );
  const result = await ctx.agent.com.atproto.repo.createRecord({
    repo: ctx.userDid,
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
  const ctx = await getRepoContext();
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
  const ctx = await getRepoContext();
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
  const ctx = await getRepoContext();
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
  const ctx = await getRepoContext();
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
  if (parsed.did !== ctx.userDid) {
    throw new Error(
      "deleteHypercert failed: Forbidden — URI DID does not match active session DID.",
    );
  }
  await ctx.agent.com.atproto.repo.deleteRecord({
    repo: ctx.userDid,
    collection: parsed.collection || "org.hypercerts.claim.activity",
    rkey: parsed.rkey,
  });
  return { success: true };
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
  if (parsed.did !== ctx.userDid) {
    throw new Error(
      "deleteRecord failed: Forbidden — URI DID does not match active session DID.",
    );
  }
  await ctx.agent.com.atproto.repo.deleteRecord({
    repo: ctx.userDid,
    collection: parsed.collection,
    rkey: parsed.rkey,
  });
  return { success: true };
};

export const requestEmailUpdate = async (): Promise<{
  tokenRequired: boolean;
}> => {
  const agent = await getAgent();
  if (!agent) {
    throw new Error("Not authenticated");
  }
  try {
    const result = await agent.com.atproto.server.requestEmailUpdate();
    return { tokenRequired: result.data.tokenRequired };
  } catch (error) {
    console.error("requestEmailUpdate failed:", error);
    throw error;
  }
};

export const updateEmail = async (
  email: string,
  token?: string,
): Promise<void> => {
  const agent = await getAgent();
  if (!agent) {
    throw new Error("Not authenticated");
  }
  try {
    await agent.com.atproto.server.updateEmail({ email, token });
  } catch (error) {
    console.error("updateEmail failed:", error);
    throw error;
  }
};
