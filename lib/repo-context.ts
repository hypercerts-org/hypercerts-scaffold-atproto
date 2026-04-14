import "server-only";
import { cache } from "react";
import { Agent } from "@atproto/api";
import { getSession } from "@/lib/atproto-session";

export interface RepoContext {
  userDid: string;
  agent: Agent;
}

export const getRepoContext = cache(
  async function getRepoContext(): Promise<RepoContext | null> {
    const session = await getSession();
    if (!session) return null;

    try {
      const agent = new Agent(session);
      return { userDid: session.did, agent };
    } catch (error) {
      console.error("Failed to build repo context:", error);
      return null;
    }
  },
);
