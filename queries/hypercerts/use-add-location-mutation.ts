"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { addLocation } from "@/lib/api/hypercerts";

interface AddLocationParams {
  lpVersion: string;
  srs: string;
  locationType: string;
  createdAt: string;
  name?: string;
  description?: string;
  contentMode: "link" | "file";
  locationUrl?: string;
  locationFile?: File;
  hypercertUri: string;
}

interface UseAddLocationMutationOptions {
  onSuccess?: () => void;
}

export function useAddLocationMutation(
  options?: UseAddLocationMutationOptions,
) {
  return useMutation({
    mutationFn: (params: AddLocationParams) => addLocation(params),
    onSuccess: () => {
      toast.success("Location added successfully!");
      options?.onSuccess?.();
    },
    onError: (error) => {
      console.error("Add location error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to add location: ${message}`);
    },
  });
}
