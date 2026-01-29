"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logout } from "@/lib/api/auth";

export function useLogoutMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    },
  });
}
