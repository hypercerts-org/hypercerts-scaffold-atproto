import { BlobRef } from "@atproto/lexicon";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { OrgHypercertsDefs } from "@hypercerts-org/lexicon";
import type { $Typed } from "@hypercerts-org/lexicon";
import type { OrgHypercertsClaimActivity } from "@hypercerts-org/lexicon";

/** The LinearDocument.Main type as used by the hypercerts lexicon */
type LinearDocument = NonNullable<
  OrgHypercertsClaimActivity.Main["description"]
>;

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

function hasUriField(value: Record<string, unknown>): value is { uri: string } {
  return typeof value.uri === "string";
}

function hasBlobImageField(
  value: Record<string, unknown>,
): value is { image: BlobRef | string | undefined } {
  return "image" in value;
}

export function resolveHypercertImageUrl(
  image:
    | $Typed<OrgHypercertsDefs.Uri>
    | $Typed<OrgHypercertsDefs.SmallImage>
    | { $type: string }
    | Record<string, unknown>
    | undefined,
  did?: string,
  pdsUrl?: string,
): string | undefined {
  try {
    if (!image) {
      return undefined;
    }

    // 1. Check via $type type guards (when PDS includes $type on union members)
    if (OrgHypercertsDefs.isUri(image)) {
      return (image as OrgHypercertsDefs.Uri).uri;
    }

    if (OrgHypercertsDefs.isSmallImage(image)) {
      return getBlobURL(
        (image as OrgHypercertsDefs.SmallImage).image,
        did,
        pdsUrl,
      );
    }

    // 2. Structural fallback — PDS may omit $type on union members.
    //    Check for Uri shape: { uri: string }
    if ("uri" in image && hasUriField(image)) {
      return image.uri;
    }

    //    Check for SmallImage shape: { image: <BlobRef-like with ref> }
    if (hasBlobImageField(image)) {
      return getBlobURL(image.image, did, pdsUrl);
    }

    return undefined;
  } catch (e) {
    console.error("resolveHypercertImageUrl failed:", e, {
      image,
      did,
      pdsUrl,
    });
    return undefined;
  }
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

/**
 * Converts a plain string into a PubLeafletPagesLinearDocument.Main structure
 * suitable for the `description` field on activity and attachment records.
 */
export function stringToLinearDocument(text: string): LinearDocument {
  return {
    $type: "pub.leaflet.pages.linearDocument",
    blocks: [
      {
        block: {
          $type: "pub.leaflet.blocks.text",
          plaintext: text,
        } as LinearDocument["blocks"][number]["block"],
      },
    ],
  };
}

/**
 * Extracts plain text from a PubLeafletPagesLinearDocument.Main structure.
 * Returns an empty string if the document is undefined or has no text blocks.
 */
export function linearDocumentToString(
  doc: LinearDocument | undefined,
): string {
  if (!doc?.blocks) return "";
  return doc.blocks
    .map(
      (b: LinearDocument["blocks"][number]) =>
        (b.block as { plaintext?: string })?.plaintext ?? "",
    )
    .filter(Boolean)
    .join("\n");
}
