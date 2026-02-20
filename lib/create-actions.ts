"use server";
import { getRepoContext } from "@/lib/repo-context";
import { resolveRecordBlobs } from "./blob-utils";

import { RepositoryRole } from "@hypercerts-org/sdk-core";
import { cookies } from "next/headers";
import { getSession } from "./atproto-session";
import sdk from "./hypercerts-sdk";

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
  sdk.revokeSession(session.sub);
};

// TODO addContribution in SDK needs to be updated so for now contributions will directly be added through hypercert create
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const addContribution = async (_params: {
  hypercertUri: string;
  contributors: string[];
  contributionDetails: {
    role: string;
    contributionDescription?: string;
    startDate?: string;
    endDate?: string;
  };
}) => {
  return true;
  // const ctx = await getRepoContext();

  // if (!ctx) {
  //   throw new Error("Unable to get authenticated repository");
  // }

  // return ctx.scopedRepo.hypercerts.addContribution(params);
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
