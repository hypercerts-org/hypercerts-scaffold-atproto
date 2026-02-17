"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { login } from "@/lib/api/auth";

export function useLoginMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      router.push(data.authUrl);
    },
    onError: (error) => {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`An error occurred while logging in: ${message}`);
    },
  });
}
