"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteRecord } from "@/lib/create-actions";

interface UseDeleteRecordMutationOptions {
  onSuccess?: () => void;
}

export function useDeleteRecordMutation(
  options?: UseDeleteRecordMutationOptions,
) {
  return useMutation({
    mutationFn: (params: { recordUri: string }) => deleteRecord(params),
    onSuccess: () => {
      toast.success("Record deleted successfully!");
      options?.onSuccess?.();
    },
    onError: (error) => {
      console.error("Delete record error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete record.",
      );
    },
  });
}
