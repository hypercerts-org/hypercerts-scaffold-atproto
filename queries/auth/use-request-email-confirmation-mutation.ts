"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestEmailConfirmation } from "@/lib/email-actions";

export function useRequestEmailConfirmationMutation() {
  return useMutation({
    mutationFn: () => requestEmailConfirmation(),
    onSuccess: () => {
      toast.success("Verification email sent! Check your inbox.");
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send verification email";
      toast.error(message);
    },
  });
}
