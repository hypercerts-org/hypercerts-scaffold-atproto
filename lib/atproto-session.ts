import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import sdk from "@/lib/hypercerts-sdk";
import type { Repository } from "@hypercerts-org/sdk-core";

export const getAuthenticatedRepo = cache(async function getAuthenticatedRepo(
  serverOverride?: "pds" | "sds"
): Promise<Repository | null> {
  const cookieStore = await cookies();
  const userDid = cookieStore.get("user-did")?.value;

  if (!userDid) {
    return null;
  }

  const activeDid = cookieStore.get("active-did")?.value || userDid;

  let determinedServer: "pds" | "sds";
  if (serverOverride) {
    determinedServer = serverOverride;
  } else if (activeDid !== userDid) {
    determinedServer = "sds"; // If active DID is an organization, default to SDS
  } else {
    determinedServer = "pds"; // If active DID is the user's, default to PDS
  }

  try {
    const session = await sdk.restoreSession(userDid);
    if (!session) return null;
    return sdk.repository(session, { server: determinedServer });
  } catch (error) {
    console.error(`Failed to restore session for DID ${userDid}:`, error);
    return null;
  }
});

export const getSession = cache(async function getSession() {
  const cookieStore = await cookies();
  const did = cookieStore.get("user-did")?.value;

  if (!did) {
    return null;
  }

  try {
    const session = await sdk.restoreSession(did);
    return session;
  } catch (error) {
    console.error(`Failed to restore session for DID ${did}:`, error);
    return null;
  }
});
