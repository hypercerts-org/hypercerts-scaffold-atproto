"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { getMeasurementLinks } from "@/lib/api/external/constellation";
import { getMeasurementRecord } from "@/lib/create-actions";
import { queryKeys } from "@/lib/api/query-keys";

export function useMeasurementLinksQuery(hypercertUri: string) {
  return useQuery({
    queryKey: queryKeys.hypercerts.measurements(hypercertUri),
    queryFn: () => getMeasurementLinks(hypercertUri),
  });
}

export function useMeasurementRecordsQuery(
  links: { did: string; collection: string; rkey: string }[] | undefined,
) {
  return useQueries({
    queries: (links || []).map((link) => ({
      queryKey: queryKeys.hypercerts.measurementRecord(link.did, link.rkey),
      queryFn: () =>
        getMeasurementRecord({
          did: link.did,
          collection: link.collection,
          rkey: link.rkey,
        }),
    })),
  });
}
