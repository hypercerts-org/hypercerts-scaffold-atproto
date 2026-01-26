"use client";

import { useQuery } from "@tanstack/react-query";
import { searchActors } from "@/lib/api/external/bluesky";
import { queryKeys } from "@/lib/api/query-keys";

export function useUserSearchQuery(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.external.bluesky.searchActors(query),
    queryFn: () => searchActors(query),
    enabled: enabled && !!query.trim(),
  });
}
