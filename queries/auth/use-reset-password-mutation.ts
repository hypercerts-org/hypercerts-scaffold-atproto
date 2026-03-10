"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { resetPassword } from "@/lib/api/external/bluesky";

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      resetPassword(token, password),
    onSuccess: () => {
      toast.success("Password reset successfully!");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to reset password";
      toast.error(message);
    },
  });
}
