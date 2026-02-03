import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrganizationInfo } from "@hypercerts-org/sdk-core";

interface OrganizationCreationSuccessProps {
  orgInfo: OrganizationInfo;
  onNext: () => void;
}

export default function OrganizationCreationSuccess({
  orgInfo,
  onNext,
}: OrganizationCreationSuccessProps) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-scale-in">
      {/* Success header */}
      <div className="px-6 pt-6 pb-5 border-b border-border/50">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-full bg-create-accent/10 flex items-center justify-center shrink-0 animate-pulse-glow">
            <CheckCircle className="size-6 text-create-accent" />
          </div>

          <div className="flex-1">
            <h2 className="text-xl lg:text-2xl font-[family-name:var(--font-syne)] font-bold tracking-tight text-foreground">
              Organization Created
            </h2>
            <p className="mt-1 text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
              Your organization is now available in your workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-6 stagger-children">
        {/* Optional description */}
        {orgInfo.description && (
          <div className="rounded-xl bg-muted/40 border border-border/30 p-4 text-sm font-[family-name:var(--font-outfit)] leading-relaxed text-foreground">
            {orgInfo.description}
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow label="Name" value={orgInfo.name} />
          <InfoRow label="Handle" value={`@${orgInfo.handle}`} />
          <InfoRow label="DID" value={orgInfo.did} mono />
          <InfoRow label="Created" value={orgInfo.createdAt} />
        </div>

        {/* Footer */}
        <div className="pt-4 flex justify-end border-t border-border/50">
          <Button
            onClick={onNext}
            className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-medium gap-2"
          >
            Add Contributors
            <ArrowRight className="size-4" />
          </Button>
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
    <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-wider font-[family-name:var(--font-outfit)] text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className={`text-sm font-[family-name:var(--font-outfit)] font-medium text-foreground ${
          mono ? "font-mono text-xs break-all leading-relaxed" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
