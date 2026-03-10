"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteHypercert } from "@/lib/create-actions";
import { queryKeys } from "@/lib/api/query-keys";

interface UseDeleteHypercertMutationOptions {
  onSuccess?: () => void;
}

export function useDeleteHypercertMutation(
  options?: UseDeleteHypercertMutationOptions,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { hypercertUri: string }) => deleteHypercert(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.hypercerts.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.hypercerts.detail(variables.hypercertUri),
      });
      toast.success("Hypercert deleted successfully!");
      options?.onSuccess?.();
    },
    onError: (error) => {
      console.error("Delete hypercert error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete hypercert.",
      );
    },
  });
}
