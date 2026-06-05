"use server";
import { getRepoContext } from "@/lib/repo-context";
import { resolveRecordBlobs } from "@/lib/blob-utils";
import { parseAtUri } from "@/lib/utils";
import {
  resolveStrongRef,
  processLocations,
  type StrongRef,
} from "@/lib/atproto-writes";
import { coerceAtprotoDatetime, currentAtprotoDatetime } from "@/lib/datetime";
import {
  OrgHypercertsClaimContribution,
  OrgHypercertsClaimContributorInformation,
  OrgHypercertsContextEvaluation,
  OrgHypercertsContextMeasurement,
} from "@hypercerts-org/lexicon";
import { assertValidRecord } from "@/lib/record-validation";
import { processContributions } from "@/lib/contribution-helpers";

export interface SerializedRecord {
  uri: string;
  cid: string;
  value: Record<string, unknown>;
}

const OWNED_CHILD_COLLECTIONS = new Set([
  "org.hypercerts.claim.rights",
  "org.hypercerts.claim.contribution",
  "org.hypercerts.claim.contributorInformation",
]);

function isStrongRef(value: unknown): value is StrongRef {
  return (
    typeof value === "object" &&
    value !== null &&
    "uri" in value &&
    "cid" in value &&
    typeof (value as Record<string, unknown>).uri === "string" &&
    typeof (value as Record<string, unknown>).cid === "string"
  );
}

function getOwnedChildRefs(
  record: Record<string, unknown>,
  ownerDid: string,
): StrongRef[] {
  const refs: StrongRef[] = [];
  const maybeAdd = (value: unknown) => {
    if (!isStrongRef(value)) return;
    const parsed = parseAtUri(value.uri);
    if (
      parsed?.did === ownerDid &&
      parsed.collection &&
      OWNED_CHILD_COLLECTIONS.has(parsed.collection)
    ) {
      refs.push(value);
    }
  };

  maybeAdd(record.rights);

  const contributors = Array.isArray(record.contributors)
    ? record.contributors
    : [];
  for (const contributor of contributors) {
    if (typeof contributor !== "object" || contributor === null) continue;
    const entry = contributor as Record<string, unknown>;
    maybeAdd(entry.contributorIdentity);
    maybeAdd(entry.contributionDetails);
  }

  return refs;
}

export const addContribution = async (params: {
  hypercertUri: string;
  contributors: string[];
  contributionDetails: {
    role: string;
    contributionDescription?: string;
    startDate?: string;
    endDate?: string;
  };
  weight?: string;
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
      weight: params.weight,
    },
  ]);

  return result;
};

export const addEvaluation = async (params: {
  hypercertUri: string;
  evaluators: string[];
  summary: string;
  score?: { min: string; max: string; value: string };
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

  const normalizedScore = evaluationData.score
    ? {
        min: `${evaluationData.score.min}`,
        max: `${evaluationData.score.max}`,
        value: `${evaluationData.score.value}`,
      }
    : undefined;

  const record: OrgHypercertsContextEvaluation.Record = {
    $type: "org.hypercerts.context.evaluation",
    subject,
    evaluators: evaluationData.evaluators.map((did) => ({ did })),
    summary: evaluationData.summary,
    createdAt: currentAtprotoDatetime(),
    ...(normalizedScore ? { score: normalizedScore } : {}),
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

  const normalizedStartDate = params.startDate
    ? coerceAtprotoDatetime(params.startDate, "measurement startDate")
    : undefined;
  const normalizedEndDate = params.endDate
    ? coerceAtprotoDatetime(params.endDate, "measurement endDate")
    : undefined;

  const record: OrgHypercertsContextMeasurement.Record = {
    $type: "org.hypercerts.context.measurement",
    subjects: [subject],
    metric: params.metric,
    value: params.value,
    unit: params.unit,
    createdAt: currentAtprotoDatetime(),
    ...(params.measurers?.length
      ? { measurers: params.measurers.map((did) => ({ did })) }
      : {}),
    ...(normalizedStartDate ? { startDate: normalizedStartDate } : {}),
    ...(normalizedEndDate ? { endDate: normalizedEndDate } : {}),
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

export const getContributionRecord = async (params: {
  did: string;
  collection: string;
  rkey: string;
  cid: string;
}): Promise<SerializedRecord> => {
  const { did, collection, rkey, cid } = params;
  const ctx = await getRepoContext();
  if (!ctx) {
    throw new Error(
      "getContributionRecord failed: could not establish repository context. The user session may have expired or the target DID is unreachable.",
    );
  }
  if (collection !== "org.hypercerts.claim.contribution") {
    throw new Error(
      "getContributionRecord failed: expected org.hypercerts.claim.contribution reference.",
    );
  }

  const result = await ctx.agent.com.atproto.repo.getRecord({
    repo: did,
    collection,
    rkey,
  });
  if (result.data.cid !== cid) {
    throw new Error("getContributionRecord failed: strongRef CID mismatch.");
  }
  if (!OrgHypercertsClaimContribution.isRecord(result.data.value)) {
    throw new Error(
      "getContributionRecord failed: referenced record is not a contribution.",
    );
  }

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
  cid: string;
}): Promise<SerializedRecord> => {
  const { did, collection, rkey, cid } = params;
  const ctx = await getRepoContext();
  if (!ctx) {
    throw new Error(
      "getContributorInformationRecord failed: could not establish repository context. The user session may have expired or the target DID is unreachable.",
    );
  }
  if (collection !== "org.hypercerts.claim.contributorInformation") {
    throw new Error(
      "getContributorInformationRecord failed: expected org.hypercerts.claim.contributorInformation reference.",
    );
  }

  const result = await ctx.agent.com.atproto.repo.getRecord({
    repo: did,
    collection,
    rkey,
  });
  if (result.data.cid !== cid) {
    throw new Error(
      "getContributorInformationRecord failed: strongRef CID mismatch.",
    );
  }
  if (!OrgHypercertsClaimContributorInformation.isRecord(result.data.value)) {
    throw new Error(
      "getContributorInformationRecord failed: referenced record is not contributor information.",
    );
  }

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
  const collection = parsed.collection || "org.hypercerts.claim.activity";
  const existingResult = await ctx.agent.com.atproto.repo.getRecord({
    repo: ctx.userDid,
    collection,
    rkey: parsed.rkey,
  });
  const childRefs = getOwnedChildRefs(
    existingResult.data.value as Record<string, unknown>,
    ctx.userDid,
  );

  await ctx.agent.com.atproto.repo.deleteRecord({
    repo: ctx.userDid,
    collection,
    rkey: parsed.rkey,
  });

  const uniqueChildRefs = [
    ...new Map(childRefs.map((ref) => [ref.uri, ref])).values(),
  ];
  const cleanupResults = await Promise.allSettled(
    uniqueChildRefs.map((ref) => {
      const child = parseAtUri(ref.uri);
      if (!child?.collection || !child.rkey) return Promise.resolve();
      return ctx.agent.com.atproto.repo.deleteRecord({
        repo: ctx.userDid,
        collection: child.collection,
        rkey: child.rkey,
      });
    }),
  );

  for (const result of cleanupResults) {
    if (result.status === "rejected") {
      console.error("deleteHypercert child cleanup failed:", result.reason);
    }
  }

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
