import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { Agent } from "@atproto/api";
import type { OAuthSession } from "@atproto/oauth-client-node";
import oauthClient, { sessionIdStore } from "@/lib/hypercerts-sdk";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

export type { OAuthSession };

export const getSession = cache(
  async function getSession(): Promise<OAuthSession | null> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionId) return null;

    const userDid = await sessionIdStore.get(sessionId);
    if (!userDid) {
      console.warn(`No DID mapping found for session id ${sessionId}`);
      return null;
    }

    try {
      const restoredSession = await oauthClient.restore(userDid);
      if (!restoredSession || restoredSession.did !== userDid) {
        console.warn(
          `Session restore mismatch (sid=${sessionId}, expected DID=${userDid})`,
        );
        return null;
      }
      return restoredSession;
    } catch (error) {
      console.error(`Failed to restore session for DID ${userDid}:`, error);
      return null;
    }
  },
);

export const getAgent = cache(async function getAgent(): Promise<Agent | null> {
  const session = await getSession();
  if (!session) return null;
  return new Agent(session);
});

export const resolveHandle = cache(async function resolveHandle(
  agent: Agent,
  did: string,
): Promise<string | undefined> {
  try {
    const result = await agent.com.atproto.repo.describeRepo({ repo: did });
    return result.data.handle;
  } catch (error) {
    console.error(`Failed to resolve handle for DID ${did}:`, error);
    return undefined;
  }
});
