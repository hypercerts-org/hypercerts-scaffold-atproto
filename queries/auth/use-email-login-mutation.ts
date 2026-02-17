"use client";

import { useMutation } from "@tanstack/react-query";
import { emailLogin } from "@/lib/api/auth";

export function useEmailLoginMutation() {
  return useMutation({
    mutationFn: (email: string) => emailLogin(email),
    onSuccess: (data) => {
      // Full-page redirect to the external sidecar auth service.
      // router.push() only works for internal Next.js routes.
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      console.error("Email login error:", error);
    },
  });
}
