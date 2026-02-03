"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { OrganizationInfo } from "@hypercerts-org/sdk-core";
import { toast } from "sonner";

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

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Succesfully copied to clipboard");
    } catch {
      toast.error("Oops couldnt copy it down");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{organization.name}</CardTitle>
              <CardDescription>
                {organization.description?.trim() || "No description provided."}
              </CardDescription>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge>@{organization.handle}</Badge>
                <Badge variant="secondary" className="capitalize">
                  Access: {organization.accessType}
                </Badge>
                {typeof organization.collaboratorCount === "number" ? (
                  <Badge variant="outline">
                    {organization.collaboratorCount} collaborators
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(organization.did)}
              >
                Copy DID
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(organization.handle)}
              >
                Copy handle
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Separator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Organization DID
              </div>
              <div className="font-mono text-sm break-all">
                {organization.did}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-sm">
                <FormatIso iso={organization.createdAt} />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="text-sm text-muted-foreground">
                Your permissions
              </div>
              {enabledPerms.length === 0 ? (
                <Badge variant="outline">No permissions</Badge>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {enabledPerms.map((p) => (
                    <Badge key={p} variant="secondary" className="capitalize">
                      {p}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
