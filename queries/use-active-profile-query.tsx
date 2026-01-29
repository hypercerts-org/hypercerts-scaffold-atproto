"use client";

import { useQuery } from "@tanstack/react-query";
import { getActiveProfileInfo } from "@/lib/create-actions";
import { queryKeys } from "@/lib/api/query-keys";

export const useActiveProfile = () => {
  return useQuery({
    queryKey: queryKeys.profile.active(),
    queryFn: getActiveProfileInfo,
  });
};
