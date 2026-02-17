import "server-only";
import sdk from "./hypercerts-sdk";
import type { OAuthSession } from "@atproto/oauth-client-node";

/**
 * Resolves the actual PDS URL from a session.
 * Falls back to Bluesky CDN marker if resolution fails.
 *
 * @param session - The ATProto session
 * @returns The PDS URL to use for blob fetching (either actual PDS or CDN marker)
 */
export async function resolveSessionPds(
  session: OAuthSession,
): Promise<string> {
  try {
    const pdsUrl = await sdk.resolveSessionPds(session);
    // Remove trailing slash if present
    return pdsUrl.endsWith("/") ? pdsUrl.slice(0, -1) : pdsUrl;
  } catch (error) {
    console.warn(
      "Failed to resolve PDS URL from session, falling back to CDN:",
      error,
    );
    // Return CDN marker - getBlobURL will detect this and format accordingly
    return "https://cdn.bsky.app";
  }
}
