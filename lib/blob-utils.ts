import "server-only";
import { getSession } from "./atproto-session";
import { getRepoContext } from "./repo-context";
import { getBlobURL } from "./utils";
import { resolveSessionPds } from "./server-utils";
import { BlobRef } from "@atproto/lexicon";

function isBlobRefLike(v: Record<string, unknown>): boolean {
  // Plain serialized blob: { $type: "blob", mimeType, ref: { $link } }
  if (v.$type === "blob" && typeof v.mimeType === "string") {
    const ref = v.ref as Record<string, unknown> | undefined;
    if (ref && typeof ref.$link === "string") return true;
  }
  // BlobRef class instance: { mimeType, size, ref: CID, original: { $type: "blob", ref: { $link } } }
  // The class instance has no top-level $type but has an `original` with one.
  if (typeof v.mimeType === "string" && typeof v.size === "number") {
    const original = v.original as Record<string, unknown> | undefined;
    if (original?.$type === "blob") return true;
  }
  return false;
}

export async function resolveBlobToUrl(
  blob: BlobRef | string | undefined,
  ownerDid: string,
): Promise<string | undefined> {
  if (!blob) return undefined;
  if (typeof blob === "string") return blob;

  // Try to resolve via authenticated session first (gives correct PDS URL)
  const [session, viewCtx] = await Promise.all([
    getSession(),
    getRepoContext(),
  ]);
  if (session && viewCtx) {
    const pdsUrl = await resolveSessionPds(session);
    return getBlobURL(blob, ownerDid, pdsUrl);
  }

  // Unauthenticated fallback: build URL from NEXT_PUBLIC_PDS_URL
  // Works for public blobs on the known PDS without requiring a session.
  console.warn(
    "[resolveBlobToUrl] No session — falling back to NEXT_PUBLIC_PDS_URL for blob resolution",
  );
  return getBlobURL(blob, ownerDid, process.env.NEXT_PUBLIC_PDS_URL);
}

/**
 * Recursively search and resolve blobs in a record value.
 * This ensures the object returned to the client is "plain" and contains string URLs instead of CID/BlobRef objects.
 */
export async function resolveRecordBlobs(
  value: unknown,
  ownerDid: string,
): Promise<unknown> {
  if (!value || typeof value !== "object") return value;

  // Handle arrays
  if (Array.isArray(value)) {
    return Promise.all(value.map((v) => resolveRecordBlobs(v, ownerDid)));
  }

  const obj = value as Record<string, unknown>;

  // Check if this object is a BlobRef (has $type: 'blob', string mimeType, and ref.$link string)
  if (isBlobRefLike(obj)) {
    return await resolveBlobToUrl(obj as unknown as BlobRef, ownerDid);
  }

  // Recursively process properties in parallel
  const entries = Object.entries(obj);
  const resolved = await Promise.all(
    entries.map(([, val]) => resolveRecordBlobs(val, ownerDid)),
  );
  const result: Record<string, unknown> = {};
  entries.forEach(([key], i) => {
    result[key] = resolved[i];
  });
  return result;
}
