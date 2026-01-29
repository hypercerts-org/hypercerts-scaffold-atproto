"use client";

import { useQuery } from "@tanstack/react-query";
import { checkHandleAvailability } from "@/lib/api/external/bluesky";
import { queryKeys } from "@/lib/api/query-keys";

export function useCheckHandleQuery(handlePrefix: string, sdsUrl: string) {
  return useQuery({
    queryKey: queryKeys.organizations.checkHandle(handlePrefix),
    queryFn: () => checkHandleAvailability(handlePrefix, sdsUrl),
    enabled: !!handlePrefix && !!sdsUrl,
    retry: 1,
  });
}
