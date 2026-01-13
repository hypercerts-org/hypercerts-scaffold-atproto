"use client";

import { useQuery } from "@tanstack/react-query";
import { getActiveProfileInfo } from "@/lib/create-actions";

export const useActiveProfile = () => {
  return useQuery({
    queryKey: ["active-profile"],
    queryFn: getActiveProfileInfo,
  });
};
