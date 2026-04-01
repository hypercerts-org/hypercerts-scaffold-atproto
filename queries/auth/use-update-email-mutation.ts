"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateEmail } from "@/lib/email-actions";

export function useUpdateEmailMutation() {
  return useMutation({
    mutationFn: ({ token, email }: { token: string; email: string }) =>
      updateEmail(token, email),
    onSuccess: () => {
      toast.success("Email updated successfully!");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to update email";
      toast.error(message);
    },
  });
}
