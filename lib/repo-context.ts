import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { Agent } from "@atproto/api";
import oauthClient from "@/lib/hypercerts-sdk";

export interface RepoContextOptions {
  targetDid?: string;
}

export interface RepoContext {
  userDid: string;
  activeDid: string;
  targetDid: string;
  agent: Agent;
}

export const getRepoContext = cache(async function getRepoContext(
  options: RepoContextOptions = {},
): Promise<RepoContext | null> {
  const cookieStore = await cookies();

  const userDid = cookieStore.get("user-did")?.value;
  if (!userDid) {
    console.warn("[getRepoContext] No user-did cookie found");
    return null;
  }

  const activeDid = cookieStore.get("active-did")?.value || userDid;
  const targetDid = options.targetDid || activeDid;

  try {
    const session = await oauthClient.restore(userDid);
    if (!session) return null;
    const agent = new Agent(session);
    return { userDid, activeDid, targetDid, agent };
  } catch (error) {
    console.error(
      `Failed to build repo context (userDid=${userDid}, targetDid=${targetDid}):`,
      error,
    );
    return null;
  }
});
