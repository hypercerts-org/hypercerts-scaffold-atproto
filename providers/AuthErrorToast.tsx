"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function AuthErrorToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (!authError) return;

    const description = searchParams.get("auth_error_description");

    if (authError === "access_denied") {
      toast.error("Login cancelled. You can try again when you're ready.");
    } else {
      toast.error(
        description ||
          `Authentication failed (${authError}). Please try again.`,
      );
    }

    router.replace(pathname);
  }, [searchParams, router, pathname]);

  return null;
}
