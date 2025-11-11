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

  // case 3: object with ref (BlobRef)
  if (blobRef && "ref" in blobRef && "ref" in blobRef.original) {
    const cid = blobRef.ref ?? undefined;
    if (!did || !cid) return undefined;

    const url = `${PDS_URL}xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(
      did
    )}&cid=${encodeURIComponent(cid as string)}`;
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
