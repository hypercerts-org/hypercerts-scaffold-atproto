"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createHypercertFromParams } from "@/lib/api/hypercerts";
import type { CreateHypercertParams } from "@hypercerts-org/sdk-core";

interface UseCreateHypercertMutationOptions {
  onSuccess?: (
    data: Awaited<ReturnType<typeof createHypercertFromParams>>,
  ) => void;
}

export function useCreateHypercertMutation(
  options?: UseCreateHypercertMutationOptions,
) {
  return useMutation({
    mutationFn: (params: CreateHypercertParams) =>
      createHypercertFromParams(params),
    onSuccess: (data) => {
      toast.success("Hypercert created successfully!");
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      console.error("Create hypercert error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create hypercert. Please try again.");
      }
    },
  });
}
