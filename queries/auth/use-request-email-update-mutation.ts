"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestEmailUpdate } from "@/lib/email-actions";

export function useRequestEmailUpdateMutation() {
  return useMutation({
    mutationFn: () => requestEmailUpdate(),
    onSuccess: () => {
      toast.success("Email update request sent! Check your inbox.");
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to request email update";
      toast.error(message);
    },
  });
}
