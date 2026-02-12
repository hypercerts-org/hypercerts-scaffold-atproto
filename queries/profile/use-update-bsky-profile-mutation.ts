"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateBskyProfile } from "@/lib/api/bsky-profile";
import { queryKeys } from "@/lib/api/query-keys";

interface UpdateBskyProfileParams {
  displayName?: string | null;
  description?: string | null;
  avatar?: File | null;
  banner?: File | null;
}

interface UseUpdateBskyProfileMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof updateBskyProfile>>) => void;
}

export function useUpdateBskyProfileMutation(
  options?: UseUpdateBskyProfileMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateBskyProfileParams) => updateBskyProfile(params),
    onSuccess: (data) => {
      toast.success("Bsky profile successfully updated");
      // Invalidate profile queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile.active(),
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      console.error("Update Bsky profile error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to save Bsky profile");
      }
    },
  });
}
