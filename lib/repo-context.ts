// lib/repo-context.ts
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import sdk from "@/lib/hypercerts-sdk";
import type { Repository } from "@hypercerts-org/sdk-core";

export type RepoServer = "pds";

export interface RepoContextOptions {
  /**
   * Which DID you want to act on for this operation.
   * Defaults to activeDid (cookie "active-did") falling back to userDid.
   */
  targetDid?: string;
}

export interface RepoContext {
  userDid: string;
  activeDid: string;
  targetDid: string;
  server: RepoServer;

  /**
   * Authenticated Repository routed to the selected server.
   * (Not necessarily scoped to targetDid.)
   */
  repository: Repository;

  /**
   * Repository scoped to targetDid via `.repo(targetDid)`.
   * Use this for calls that should operate "as" the target DID.
   */
  scopedRepo: ReturnType<Repository["repo"]>;
}

/**
 * Scaffold helper: resolves user/active/target DID, picks server routing, restores
 * the user's session, and returns both the server-routed repository and a target-scoped repo.
 */
export const getRepoContext = cache(async function getRepoContext(
  options: RepoContextOptions = {}
): Promise<RepoContext | null> {
  const cookieStore = await cookies();

  const userDid = cookieStore.get("user-did")?.value;
  if (!userDid) {
    console.warn("[getRepoContext] No user-did cookie found; user is not logged in or session has expired.");
    return null;
  }

  const activeDid = cookieStore.get("active-did")?.value || userDid;
  const targetDid = options.targetDid || activeDid;

  const server: RepoServer = "pds";

  try {
    const session = await sdk.restoreSession(userDid);
    if (!session) return null;

    const repository = await sdk.repository(session, { server });
    const scopedRepo = repository.repo(targetDid);

    return { userDid, activeDid, targetDid, server, repository, scopedRepo };
  } catch (error) {
    console.error(
      `Failed to build repo context (userDid=${userDid}, targetDid=${targetDid}, server=${server}):`,
      error
    );
    return null;
  }
});
