import "server-only";

import {
  AppCertifiedActorProfile,
  OrgHypercertsDefs,
} from "@hypercerts-org/lexicon";

import { getBlobURL } from "@/lib/utils";

/**
 * Safely extracts a URL from a certified profile avatar/banner union type.
 *
 * The union is: $Typed<Uri> | $Typed<SmallImage> | $Typed<LargeImage> | { $type: string }
 * - Uri ($type 'org.hypercerts.defs#uri'): has a `uri` string — return it directly
 * - SmallImage ($type 'org.hypercerts.defs#smallImage'): has an `image` BlobRef — pass to getBlobURL
 * - LargeImage ($type 'org.hypercerts.defs#largeImage'): has an `image` BlobRef — pass to getBlobURL
 * - Unknown $type: return undefined
 */
export function getCertifiedProfileImageURL(
  field:
    | AppCertifiedActorProfile.Record["avatar"]
    | AppCertifiedActorProfile.Record["banner"],
  did: string,
  pdsUrl: string | undefined,
): string | undefined {
  if (!field) return undefined;
  if (OrgHypercertsDefs.isUri(field)) {
    return field.uri;
  }
  if (OrgHypercertsDefs.isSmallImage(field)) {
    return getBlobURL(field.image, did, pdsUrl);
  }
  if (OrgHypercertsDefs.isLargeImage(field)) {
    return getBlobURL(field.image, did, pdsUrl);
  }
  return undefined;
}
