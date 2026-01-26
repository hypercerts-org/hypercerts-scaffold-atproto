"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addEvidence } from "@/lib/api/hypercerts";
import { queryKeys } from "@/lib/api/query-keys";

interface AddEvidenceParams {
  title: string;
  shortDescription: string;
  description?: string;
  relationType?: string;
  hypercertUri: string;
  evidenceMode: "link" | "file";
  evidenceUrl?: string;
  evidenceFile?: File;
}

interface UseAddEvidenceMutationOptions {
  onSuccess?: () => void;
}

export function useAddEvidenceMutation(
  options?: UseAddEvidenceMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AddEvidenceParams) => addEvidence(params),
    onSuccess: (_, variables) => {
      toast.success("Evidence added successfully!");
      // Invalidate evidence queries for this hypercert
      queryClient.invalidateQueries({
        queryKey: queryKeys.hypercerts.evidence(variables.hypercertUri),
      });
      options?.onSuccess?.();
    },
    onError: (error) => {
      console.error("Add evidence error:", error);
      toast.error("Failed to add evidence");
    },
  });
}
