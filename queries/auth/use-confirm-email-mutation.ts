"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { confirmEmail } from "@/lib/email-actions";

export function useConfirmEmailMutation() {
  return useMutation({
    mutationFn: ({ email, token }: { email: string; token: string }) =>
      confirmEmail(email, token),
    onSuccess: () => {
      toast.success("Email verified successfully!");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to verify email";
      toast.error(message);
    },
  });
}
