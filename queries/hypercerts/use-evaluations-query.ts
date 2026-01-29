"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { getEvaluationLinks } from "@/lib/api/external/constellation";
import { getEvaluationRecord } from "@/lib/create-actions";
import { queryKeys } from "@/lib/api/query-keys";

export function useEvaluationLinksQuery(hypercertUri: string) {
  return useQuery({
    queryKey: queryKeys.hypercerts.evaluations(hypercertUri),
    queryFn: () => getEvaluationLinks(hypercertUri),
  });
}

export function useEvaluationRecordsQuery(
  links: { did: string; collection: string; rkey: string }[] | undefined
) {
  return useQueries({
    queries: (links || []).map((link) => ({
      queryKey: queryKeys.hypercerts.evaluationRecord(link.did, link.rkey),
      queryFn: () =>
        getEvaluationRecord({
          did: link.did,
          collection: link.collection,
          rkey: link.rkey,
        }),
    })),
  });
}
