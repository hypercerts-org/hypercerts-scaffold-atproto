"use server";
import { getRepoContext } from "@/lib/repo-context";
import { resolveRecordBlobs } from "./blob-utils";
import { parseAtUri } from "@/lib/utils";

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

  const profile = await ctx.scopedRepo.profile
    .getCertifiedProfile()
    .catch(() => null);
  if (!profile) return null;
  return {
    name: profile.displayName || profile.handle,
    handle: profile.handle,
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

  return ctx.scopedRepo.hypercerts.addContribution({
    hypercertUri: params.hypercertUri,
    contributors: params.contributors,
    contributionDetails: params.contributionDetails,
  });
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

  return ctx.scopedRepo.hypercerts.addEvaluation({
    ...evaluationData,
    subjectUri: hypercertUri,
  });
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

  return ctx.scopedRepo.hypercerts.addMeasurement({
    ...params,
    measurers: (params.measurers || []).map((measurer) => {
      return { did: measurer };
    }),
  });
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

  const data = await ctx.scopedRepo.records.get({ collection, rkey });
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

  const data = await ctx.scopedRepo.records.get({ collection, rkey });
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

  const data = await ctx.scopedRepo.records.get({ collection, rkey });
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
  const data = await ctx.scopedRepo.records.get({ collection, rkey });
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
  await ctx.scopedRepo.hypercerts.delete(params.hypercertUri);
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
  // Map measurers to SDK format if provided
  const sdkUpdates = { ...params.updates } as Record<string, unknown>;
  if (params.updates.measurers) {
    sdkUpdates.measurers = params.updates.measurers.map((did) => ({ did }));
  }
  return ctx.scopedRepo.hypercerts.updateMeasurement(
    params.measurementUri,
    sdkUpdates,
  );
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
  await ctx.scopedRepo.records.delete({
    collection: parsed.collection,
    rkey: parsed.rkey,
  });
  return { success: true };
};
