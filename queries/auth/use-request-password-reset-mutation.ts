"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/api/external/bluesky";

export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
    onSuccess: () => {
      toast.success("Password reset email sent! Check your inbox.");
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send password reset email";
      toast.error(message);
    },
  });
}
