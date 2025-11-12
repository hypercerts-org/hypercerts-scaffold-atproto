import { PDS_URL } from "@/utils/constants";
import { BlobRef } from "@atproto/lexicon";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as Hypercert from "@/lexicons/types/org/hypercerts/claim";
import * as Contribution from "@/lexicons/types/org/hypercerts/claim/contribution";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageURL(
  blobRef: BlobRef | string | { $type: string } | undefined,
  did?: string
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

    // when the ref is read then it becomes a string. forcefully cast as string to avoid ts errors for now
    const url = `${PDS_URL}xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(
      did
    )}&cid=${encodeURIComponent(cid as unknown as string)}`;
    console.log(url);
    return url;
  }

  return undefined;
}

export const validateHypercert = (data: unknown) => {
  if (Hypercert.isRecord(data) && Hypercert.validateRecord(data)) {
    return { success: true, error: null };
  } else {
    const validation = Hypercert.validateRecord(data);
    if (!validation.success) {
      return { success: false, error: validation.error.message };
    } else {
      return { success: false, error: "Invalid Hypercert Record" };
    }
  }
};

export const validateContribution = (data: unknown) => {
  if (Contribution.isRecord(data) && Contribution.validateRecord(data)) {
    return { success: true, error: null };
  } else {
    const validation = Contribution.validateRecord(data);
    if (!validation.success) {
      return { success: false, error: validation.error.message };
    } else {
      return { success: false, error: "Invalid Contribution Record" };
    }
  }
};

export function parseAtUri(atUri?: string) {
  // at://did:plc:xyz/app.namespace.record/abc123
  if (!atUri) return;
  if (!atUri.startsWith("at://")) return;
  const [did, collection, rkey] = atUri.slice("at://".length).split("/");
  if (!did || !collection || !rkey) return;
  return { did, collection, rkey };
}
