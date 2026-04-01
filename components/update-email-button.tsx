import Link from "next/link";
import { MailPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UpdateEmailButton({ email }: { email: string }) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-create-accent/10 flex size-8 items-center justify-center rounded-full">
          <MailPlus className="text-create-accent size-4" />
        </div>
        <div>
          <p className="font-[family-name:var(--font-outfit)] text-sm font-medium">
            Update Email
          </p>
          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs">
            {email || "Change your account email address"}
          </p>
        </div>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="font-[family-name:var(--font-outfit)]"
      >
        <Link href="/update-email">Update email</Link>
      </Button>
    </div>
  );
}
