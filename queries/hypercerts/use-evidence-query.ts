"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { getEvidenceLinks } from "@/lib/api/external/constellation";
import { getEvidenceRecord } from "@/lib/create-actions";
import { queryKeys } from "@/lib/api/query-keys";

export function useEvidenceLinksQuery(hypercertUri: string) {
  return useQuery({
    queryKey: queryKeys.hypercerts.evidence(hypercertUri),
    queryFn: () => getEvidenceLinks(hypercertUri),
  });
}

export function useEvidenceRecordsQuery(
  links: { did: string; collection: string; rkey: string }[] | undefined,
) {
  return useQueries({
    queries: (links || []).map((link) => ({
      queryKey: queryKeys.hypercerts.evidenceRecord(link.did, link.rkey),
      queryFn: () =>
        getEvidenceRecord({
          did: link.did,
          collection: link.collection,
          rkey: link.rkey,
        }),
    })),
  });
}
