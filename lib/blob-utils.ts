import "server-only";
import { getSession } from "./atproto-session";
import { getRepoContext } from "./repo-context";
import { getBlobURL } from "./utils";
import { BlobRef } from "@atproto/lexicon";

export async function resolveBlobToUrl(
  blob: BlobRef | string | { $type: string } | undefined,
  ownerDid: string
): Promise<string | undefined> {
  if (!blob) return undefined;
  if (typeof blob === "string") return blob;

  const session = await getSession();
  if (!session) return undefined;

  const viewCtx = await getRepoContext({ targetDid: ownerDid });
  if (!viewCtx) return undefined;

  const sessionIssuer = session.serverMetadata.issuer;

  const blobBase =
    ownerDid === viewCtx.userDid
      ? sessionIssuer
      : process.env.NEXT_PUBLIC_SDS_URL || sessionIssuer;

  return getBlobURL(blob, ownerDid, blobBase);
}

/**
 * Recursively search and resolve blobs in a record value.
 * This ensures the object returned to the client is "plain" and contains string URLs instead of CID/BlobRef objects.
 */
export async function resolveRecordBlobs(
  value: any,
  ownerDid: string
): Promise<any> {
  if (!value || typeof value !== "object") return value;

  // Handle arrays
  if (Array.isArray(value)) {
    return Promise.all(value.map((v) => resolveRecordBlobs(v, ownerDid)));
  }

  // Check if this object is a BlobRef (has $type: 'blob' or 'ref' property from atproto returns)
  if (value.$type === "blob" || (value.ref && value.mimeType)) {
    return await resolveBlobToUrl(value, ownerDid);
  }

  // Recursively process properties
  const result: any = {};
  for (const [key, val] of Object.entries(value)) {
    // Skip internal fields if any
    result[key] = await resolveRecordBlobs(val, ownerDid);
  }
  return result;
}
