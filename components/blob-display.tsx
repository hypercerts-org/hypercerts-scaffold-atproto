"use client";

import { OrgHypercertsDefs } from "@hypercerts-org/lexicon";
import { getBlobURL, getPDSlsURI } from "@/lib/utils";
import { $Typed, BlobRef } from "@atproto/api";
import { ReactNode } from "react";
import { URILink } from "./uri-link";

export function BlobDisplay({
  content,
  did,
}: {
  content: $Typed<OrgHypercertsDefs.Uri> | $Typed<BlobRef> | { $type: string };
  did?: string;
}): ReactNode {
  if (!content) return "—";
  const type = content.$type as string | undefined;

  if (type === "org.hypercerts.defs#uri") {
    const uri = (content as $Typed<OrgHypercertsDefs.Uri>).uri;
    return <URILink uri={getPDSlsURI(uri)} label={uri} />;
  }

  if (
    ["org.hypercerts.defs#smallBlob", "org.hypercerts.defs#largeBlob"].includes(
      type || "",
    )
  ) {
    const blobRef = (content as $Typed<OrgHypercertsDefs.SmallBlob>).blob;
    return (
      <p className="text-sm">
        Blob-based data
        {blobRef && (
          <>
            {" · "}
            <URILink
              uri={getBlobURL(blobRef, did)}
              label={blobRef.toString()}
            />
          </>
        )}
      </p>
    );
  }

  return "—";
}
