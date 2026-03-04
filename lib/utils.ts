import { BlobRef } from "@atproto/lexicon";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getPDSlsURI = (uri?: string) => {
  if (!uri) return;
  return `https://pdsls.dev/${uri}`;
};

export function getBlobURL(
  blobRef: BlobRef | string | undefined,
  did?: string,
  pdsUrl?: string,
): string | undefined {
  if (typeof blobRef === "string") {
    return blobRef;
  }
  if (blobRef && "ref" in blobRef) {
    const cid = blobRef.ref ?? undefined;
    if (!did || !cid) return undefined;

    const resolvedPdsUrl = pdsUrl || process.env.NEXT_PUBLIC_PDS_URL;

    // Check if we're using Bluesky CDN (fallback case) or a bsky.network PDS
    if (
      resolvedPdsUrl === "https://cdn.bsky.app" ||
      resolvedPdsUrl?.endsWith("bsky.network")
    ) {
      // Use CDN format: https://cdn.bsky.app/img/feed_thumbnail/plain/{DID}/{CID}@jpeg
      return `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${cid.toString()}@jpeg`;
    }

    // Use standard PDS format
    const url = `${resolvedPdsUrl}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(
      did,
    )}&cid=${encodeURIComponent(cid.toString())}`;
    return url;
  }
  return undefined;
}

/**
 * Converts AT Proto blob URLs to use CDN when appropriate
 * Handles URLs returned by the SDK that use XRPC getBlob endpoints
 * @param url - The blob URL (could be XRPC endpoint or already a CDN URL)
 * @returns Converted URL using CDN if applicable, otherwise original URL or empty string
 */
export function convertBlobUrlToCdn(url: string | null | undefined): string {
  if (!url) return "";

  try {
    const urlObj = new URL(url);

    // If already a CDN URL, pass through unchanged
    if (urlObj.hostname === "cdn.bsky.app") {
      return url;
    }

    // Check if this is a bsky.network PDS making an XRPC getBlob call
    if (
      urlObj.hostname.endsWith("bsky.network") &&
      urlObj.pathname === "/xrpc/com.atproto.sync.getBlob"
    ) {
      // Extract DID and CID from query parameters
      const did = urlObj.searchParams.get("did");
      const cid = urlObj.searchParams.get("cid");

      if (did && cid) {
        // Return CDN URL instead (assuming JPEG format)
        return `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${cid}@jpeg`;
      }
    }

    // Return original URL if not applicable
    return url;
  } catch (error) {
    // If URL parsing fails, return empty string as placeholder
    console.warn("Failed to parse blob URL:", url, error);
    return "";
  }
}

export function parseAtUri(atUri?: string) {
  // at://did:plc:xyz/app.namespace.record/abc123
  if (!atUri) return;
  if (!atUri.startsWith("at://")) return;
  const [did, collection, rkey] = atUri.slice("at://".length).split("/");
  if (!did || !collection || !rkey) return;
  return { did, collection, rkey };
}

export function extractDidFromAtUri(atUri: string): string | null {
  // Expected: at://<did>/<collection>/<rkey>
  const match = atUri.match(/^at:\/\/([^/]+)\/([^/]+)\/(.+)$/);
  return match ? match[1] : null;
}

/** Safely extract a string field from FormData, returning null if the value is a File */
export function getStringField(data: FormData, key: string): string | null {
  const value = data.get(key);
  return typeof value === "string" ? value : null;
}

export function buildStrongRef(cid?: string, uri?: string) {
  if (!cid || !uri) return;
  return {
    $type: "com.atproto.repo.strongRef" as const,
    cid,
    uri,
  };
}
