"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { emailLogin } from "@/lib/api/auth";

export function useEmailLoginMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: (email: string) => emailLogin(email),
    onSuccess: (data) => {
      router.push(data.authUrl);
    },
    onError: (error) => {
      console.error("Email login error:", error);
    },
  });
}
