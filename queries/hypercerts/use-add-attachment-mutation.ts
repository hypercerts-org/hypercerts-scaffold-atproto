"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addAttachment } from "@/lib/api/hypercerts";
import { queryKeys } from "@/lib/api/query-keys";
import { AttachmentLocationParam } from "@/lib/api/types";

interface AddAttachmentParams {
  title: string;
  shortDescription: string;
  description?: string;
  contentType?: string;
  hypercertUri: string;
  evidenceMode: "link" | "file";
  evidenceUrl?: string;
  evidenceFile?: File;
  location?: AttachmentLocationParam;
}

interface UseAddAttachmentMutationOptions {
  onSuccess?: () => void;
}

export function useAddAttachmentMutation(
  options?: UseAddAttachmentMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AddAttachmentParams) => addAttachment(params),
    onSuccess: (_, variables) => {
      toast.success("Attachment added successfully!");
      // Invalidate evidence queries for this hypercert
      queryClient.invalidateQueries({
        queryKey: queryKeys.hypercerts.evidence(variables.hypercertUri),
      });
      options?.onSuccess?.();
    },
    onError: (error) => {
      console.error("Add attachment error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to add attachment: ${message}`);
    },
  });
}
