"use server";

import {
  CreateHypercertParams,
  RepositoryRole,
} from "@hypercerts-org/sdk-core";
import { getAuthenticatedRepo, getSession } from "./atproto-session";
import sdk from "./hypercerts-sdk";

export interface GrantAccessParams {
  repoDid: string;
  userDid: string;
  role: RepositoryRole;
}

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

export const createOrganization = async (params: {
  handlePrefix: string;
  description: string;
  name: string;
}) => {
  const sdsRepository = await getAuthenticatedRepo("sds");
  if (!sdsRepository) {
    throw new Error("Unable to get authenticated repository");
  }
  const org = await sdsRepository.organizations.create(params);
  return org;
};

export const addCollaboratorToOrganization = async (
  params: GrantAccessParams
) => {
  const sdsRepository = await getAuthenticatedRepo("sds");
  if (!sdsRepository) {
    throw new Error("Unable to get authenticated repository");
  }
  const result = await sdsRepository.collaborators.grant(params);
  return result;
};

export const removeCollaborator = async (params: {
  userDid: string;
  repoDid: string;
}) => {
  const sdsRepository = await getAuthenticatedRepo("sds");
  if (!sdsRepository) {
    throw new Error("Unable to get authenticated repository");
  }
  const result = await sdsRepository.collaborators.revoke(params);
  return result;
};
