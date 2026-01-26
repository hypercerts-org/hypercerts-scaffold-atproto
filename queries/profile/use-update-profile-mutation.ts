"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateProfile } from "@/lib/api/profile";
import { queryKeys } from "@/lib/api/query-keys";

interface UpdateProfileParams {
  displayName: string;
  description: string;
  avatar?: File;
  banner?: File;
}

interface UseUpdateProfileMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof updateProfile>>) => void;
}

export function useUpdateProfileMutation(
  options?: UseUpdateProfileMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateProfileParams) => updateProfile(params),
    onSuccess: (data) => {
      toast.success("Profile successfully updated");
      // Invalidate profile queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile.active(),
      });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      console.error("Update profile error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to save profile");
      }
    },
  });
}
