"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateProfile } from "@/lib/api/profile";

interface UpdateProfileParams {
  displayName?: string | null;
  description?: string | null;
  pronouns?: string | null;
  website?: string | null;
  avatar?: File | null;
  banner?: File | null;
}

interface UseUpdateProfileMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof updateProfile>>) => void;
}

export function useUpdateProfileMutation(
  options?: UseUpdateProfileMutationOptions,
) {
  return useMutation({
    mutationFn: (params: UpdateProfileParams) => updateProfile(params),
    onSuccess: (data) => {
      toast.success("Profile successfully updated");
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
