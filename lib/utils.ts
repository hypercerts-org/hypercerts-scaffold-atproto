import { BlobRef } from "@atproto/lexicon";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as Hypercert from "@/lexicons/types/org/hypercerts/claim/activity";
import * as Contribution from "@/lexicons/types/org/hypercerts/claim/contribution";
import * as Evaluation from "@/lexicons/types/org/hypercerts/claim/evaluation";
import sdk from "@/lib/hypercerts-sdk";
import type { OAuthSession } from "@atproto/oauth-client-node";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getPDSlsURI = (uri?: string) => {
  if (!uri) return;
  return `https://pdsls.dev/${uri}`;
};

export function getBlobURL(
  blobRef: BlobRef | string | { $type: string } | undefined,
  did?: string,
  pdsUrl?: string
): string | undefined {
  if (typeof blobRef === "string") {
    return blobRef;
  }
  if (blobRef && "$type" in blobRef && blobRef.$type === "string") {
    return blobRef.$type;
  }
  if (blobRef && "ref" in blobRef) {
    const cid = blobRef.ref ?? undefined;
    if (!did || !cid) return undefined;

    const resolvedPdsUrl = pdsUrl || process.env.NEXT_PUBLIC_PDS_URL;
    
    // Check if we're using Bluesky CDN (fallback case)
    if (resolvedPdsUrl === "https://cdn.bsky.app") {
      // Use CDN format: https://cdn.bsky.app/img/feed_thumbnail/plain/{DID}/{CID}@jpeg
      return `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${cid.toString()}@jpeg`;
    }
    
    // Use standard PDS format
    const url = `${resolvedPdsUrl}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(
      did
    )}&cid=${encodeURIComponent(cid.toString())}`;
    return url;
  }
  return undefined;
}

export const validateHypercert = (data: unknown) => {
  if (!Hypercert.isRecord(data)) {
    return { success: false, error: "Invalid Hypercert Record" };
  }
  const validation = Hypercert.validateRecord(data);
  if (validation.success) {
    return { success: true, error: null };
  }
  return { success: false, error: validation.error.message };
};

export const validateContribution = (data: unknown) => {
  if (!Contribution.isRecord(data)) {
    return { success: false, error: "Invalid Contribution Record" };
  }
  const validation = Contribution.validateRecord(data);
  if (validation.success) {
    return { success: true, error: null };
  }
  return { success: false, error: validation.error.message };
};

export const validateEvaluation = (data: unknown) => {
  if (!Evaluation.isRecord(data)) {
    return { success: false, error: "Invalid Evaluation Record" };
  }
  const validation = Evaluation.validateRecord(data);
  if (validation.success) {
    return { success: true, error: null };
  }
  return { success: false, error: validation.error.message };
};

export function parseAtUri(atUri?: string) {
  // at://did:plc:xyz/app.namespace.record/abc123
  if (!atUri) return;
  if (!atUri.startsWith("at://")) return;
  const [did, collection, rkey] = atUri.slice("at://".length).split("/");
  if (!did || !collection || !rkey) return;
  return { did, collection, rkey };
}

export function buildStrongRef(cid?: string, uri?: string) {
  if (!cid || !uri) return;
  return {
    $type: "com.atproto.repo.strongRef" as const,
    cid,
    uri,
  };
}
