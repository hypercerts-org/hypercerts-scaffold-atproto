"use server";

import { CreateHypercertParams } from "@hypercerts-org/sdk-core";
import { getAuthenticatedRepo, getSession } from "./atproto-session";
import sdk from "./hypercerts-sdk";

export const createHypercertUsingSDK = async (
  params: CreateHypercertParams
) => {
  const personalRepository = await getAuthenticatedRepo("pds");
  if (personalRepository) {
    const data = await personalRepository.hypercerts.create(params);
    return data;
  }
};

export const logout = async () => {
  const session = await getSession();
  if (!session) {
    return;
  }
  sdk.revokeSession(session.sub);
};

export const addContribution = async (params: {
  hypercertUri?: string;
  contributors: string[];
  role: string;
  description?: string;
}) => {
  const personalRepository = await getAuthenticatedRepo("pds");
  if (personalRepository) {
    const data = await personalRepository.hypercerts.addContribution(params);
    return data;
  }
  throw new Error("Unable to get authenticated repository");
};
