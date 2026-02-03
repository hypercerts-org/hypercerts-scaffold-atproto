"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { OrganizationInfo } from "@hypercerts-org/sdk-core";
import { toast } from "sonner";
import { Building2, Calendar, Copy, Shield } from "lucide-react";

interface OrganizationDetailsViewProps {
  organization: OrganizationInfo;
}

function FormatIso({ iso }: { iso: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return <>{iso}</>;
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {d.toLocaleString()}
    </time>
  );
}

export default function OrganizationDetailsView({
  organization,
}: OrganizationDetailsViewProps) {
  const enabledPerms = Object.entries(organization.permissions ?? {})
    .filter(([, v]) => Boolean(v))
    .map(([k]) => k);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Accent strip */}
      <div className="h-1.5 bg-gradient-to-r from-create-accent/60 via-create-accent/30 to-transparent" />

      {/* Header */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-create-accent/10 flex items-center justify-center shrink-0">
              <Building2 className="size-6 text-create-accent" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl lg:text-3xl font-[family-name:var(--font-syne)] font-bold tracking-tight text-foreground">
                {organization.name}
              </h2>
              <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground max-w-lg leading-relaxed">
                {organization.description?.trim() ||
                  "No description provided."}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-[family-name:var(--font-outfit)] font-medium bg-create-accent/10 text-create-accent border border-create-accent/20">
                  @{organization.handle}
                </span>
                <Badge
                  variant="secondary"
                  className="capitalize font-[family-name:var(--font-outfit)] text-xs"
                >
                  {organization.accessType} access
                </Badge>
                {typeof organization.collaboratorCount === "number" ? (
                  <Badge
                    variant="outline"
                    className="font-[family-name:var(--font-outfit)] text-xs"
                  >
                    {organization.collaboratorCount} collaborator
                    {organization.collaboratorCount !== 1 ? "s" : ""}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="font-[family-name:var(--font-outfit)] text-xs gap-1.5"
              onClick={() => copy(organization.did, "DID")}
            >
              <Copy className="size-3" />
              Copy DID
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-[family-name:var(--font-outfit)] text-xs gap-1.5"
              onClick={() => copy(organization.handle, "Handle")}
            >
              <Copy className="size-3" />
              Copy Handle
            </Button>
          </div>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Details grid */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <dt className="text-xs uppercase tracking-wider font-[family-name:var(--font-outfit)] text-muted-foreground">
              Organization DID
            </dt>
            <dd className="font-mono text-xs break-all text-foreground leading-relaxed">
              {organization.did}
            </dd>
          </div>

          <div className="space-y-1.5">
            <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-[family-name:var(--font-outfit)] text-muted-foreground">
              <Calendar className="size-3" />
              Created
            </dt>
            <dd className="text-sm font-[family-name:var(--font-outfit)]">
              <FormatIso iso={organization.createdAt} />
            </dd>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-[family-name:var(--font-outfit)] text-muted-foreground">
              <Shield className="size-3" />
              Your Permissions
            </dt>
            {enabledPerms.length === 0 ? (
              <dd className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
                No permissions assigned
              </dd>
            ) : (
              <dd className="flex flex-wrap gap-2">
                {enabledPerms.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-[family-name:var(--font-outfit)] font-medium bg-create-accent/10 text-create-accent border border-create-accent/20 capitalize"
                  >
                    {p}
                  </span>
                ))}
              </dd>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
