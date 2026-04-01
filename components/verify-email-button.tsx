import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailButton({ email }: { email: string }) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-create-accent/10 flex size-8 items-center justify-center rounded-full">
          <Mail className="text-create-accent size-4" />
        </div>
        <div>
          <p className="font-[family-name:var(--font-outfit)] text-sm font-medium">
            Verify Email
          </p>
          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs">
            {email || "Confirm your email address"}
          </p>
        </div>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="font-[family-name:var(--font-outfit)]"
      >
        <Link href="/verify-email">Verify email</Link>
      </Button>
    </div>
  );
}
