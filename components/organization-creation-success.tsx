import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrganizationInfo } from "@hypercerts-org/sdk-core";
import Image from "next/image";

interface OrganizationCreationSuccessProps {
  orgInfo: OrganizationInfo;
  onNext: () => void;
}

export default function OrganizationCreationSuccess({
  orgInfo,
  onNext,
}: OrganizationCreationSuccessProps) {
  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl rounded-2xl border bg-background shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-8 bg-green-50/60 dark:bg-green-950/30 border-b">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Organization Created 🎉
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your organization is now available in your workspace.
              </p>
            </div>

            {/* {orgInfo.profile?.avatar && (
              <Image
                height={48}
                width={48}
                src={orgInfo.profile.avatar}
                alt={orgInfo.profile?.displayName ?? orgInfo.name}
                className="h-12 w-12 rounded-full border object-cover"
              />
            )} */}
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Optional description */}
          {orgInfo.description && (
            <div className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-foreground">
              {orgInfo.description}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoRow label="Name" value={orgInfo.name} />
            <InfoRow label="Handle" value={orgInfo.handle} />
            <InfoRow label="DID" value={orgInfo.did} mono />
            <InfoRow
              label="Created"
              value={orgInfo.createdAt}
            />
          </div>

          {/* Footer / Button aligned bottom-right */}
          <div className="pt-6 flex justify-end border-t">
            <Button onClick={onNext} className="px-6">
              Next →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}
