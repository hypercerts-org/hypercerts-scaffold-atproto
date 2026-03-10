"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateHypercert } from "@/lib/api/hypercerts";
import type { UpdateHypercertRequest } from "@/lib/api/types";
import { queryKeys } from "@/lib/api/query-keys";

interface UseUpdateHypercertMutationOptions {
  onSuccess?: (data: Awaited<ReturnType<typeof updateHypercert>>) => void;
}

export function useUpdateHypercertMutation(
  options?: UseUpdateHypercertMutationOptions,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: UpdateHypercertRequest) => updateHypercert(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.hypercerts.detail(variables.hypercertUri),
      });
      toast.success("Hypercert updated successfully!");
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      console.error("Update hypercert error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update hypercert.",
      );
    },
  });
}
