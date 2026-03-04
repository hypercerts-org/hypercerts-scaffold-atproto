import "server-only";
import { getSession } from "./atproto-session";
import { getRepoContext } from "./repo-context";
import { getBlobURL } from "./utils";
import { resolveSessionPds } from "./server-utils";
import { BlobRef } from "@atproto/lexicon";

function isBlobRefLike(v: Record<string, unknown>): boolean {
  if (v.$type !== "blob") return false;
  if (typeof v.mimeType !== "string") return false;
  const ref = v.ref as Record<string, unknown> | undefined;
  return !!ref && typeof ref.$link === "string";
}

export async function resolveBlobToUrl(
  blob: BlobRef | string | undefined,
  ownerDid: string,
): Promise<string | undefined> {
  if (!blob) return undefined;
  if (typeof blob === "string") return blob;

  const [session, viewCtx] = await Promise.all([
    getSession(),
    getRepoContext({ targetDid: ownerDid }),
  ]);
  if (!session || !viewCtx) return undefined;

  const pdsUrl = await resolveSessionPds(session);

  return getBlobURL(blob, ownerDid, pdsUrl);
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
