"use server";
import { getRepoContext } from "@/lib/repo-context";

import {
  RepositoryRole
} from "@hypercerts-org/sdk-core";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getAuthenticatedRepo, getSession } from "./atproto-session";
import sdk from "./hypercerts-sdk";

export interface GrantAccessParams {
  repoDid: string;
  userDid: string;
  role: RepositoryRole;
}
export const switchActiveProfile = async (did: string) => {
  const cookieStore = await cookies();
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

export const addContribution = async (params: {
  hypercertUri?: string;
  contributors: string[];
  role: string;
  description?: string;
}) => {
  const ctx = await getRepoContext();

  if (!ctx) {
    throw new Error("Unable to get authenticated repository");
  }

  return ctx.scopedRepo.hypercerts.addContribution(params);
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
  revalidatePath(`/organizations/${encodeURIComponent(params.repoDid)}`);
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
  revalidatePath(`/organizations/[orgDid]`, "page");
  return result;
};

export const listOrgs = async () => {
  const sdsRepository = await getAuthenticatedRepo("sds");
  if (!sdsRepository) {
    throw new Error("Unable to get authenticated repository");
  }
  const orgs = await sdsRepository.organizations.list({ limit: 100 });
  return orgs;
};
