"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { RepositoryAccessGrant } from "@hypercerts-org/sdk-core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeCollaborator as removeCollaboratorAction } from "@/lib/create-actions";
import { toast } from "sonner";

type BskyProfile = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
};

interface CollaboratorsListProps {
  collaborators: (RepositoryAccessGrant & {
    userProfile?: BskyProfile | null;
  })[];
  repoDid: string;
}

function initials(name?: string) {
  const s = (name ?? "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
}

export default function CollaboratorsList({
  collaborators,
  repoDid,
}: CollaboratorsListProps) {
  const queryClient = useQueryClient();
  const activeCollaborators = collaborators.filter((c) => !c.revokedAt);

  const removeMutation = useMutation({
    mutationFn: (params: { userDid: string; repoDid: string }) =>
      removeCollaboratorAction(params),

    onSuccess: () => {
      toast.success("Successfully removed collaborator");
      queryClient.invalidateQueries({
        queryKey: ["collaborators", repoDid],
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collaborators</CardTitle>
        <CardDescription>
          People who currently have access to this organization.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {activeCollaborators.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No collaborators found.
          </div>
        ) : (
          <div className="space-y-3">
            {activeCollaborators.map((c) => {
              const enabledPerms = Object.entries(c.permissions ?? {})
                .filter(([, v]) => Boolean(v))
                .map(([k]) => k);

              const profile = c.userProfile ?? null;
              const displayName =
                profile?.displayName?.trim() || profile?.handle || c.userDid;
              const handle = profile?.handle ? `@${profile.handle}` : "—";

              const isThisRowPending =
                removeMutation.isPending &&
                removeMutation.variables?.userDid === c.userDid;

              const revoke = () => {
                removeMutation.mutate({
                  userDid: c.userDid,
                  repoDid,
                });
              };

              return (
                <div
                  key={c.userDid}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      {profile?.avatar ? (
                        <AvatarImage src={profile.avatar} alt={displayName} />
                      ) : null}
                      <AvatarFallback>
                        {initials(profile?.displayName || profile?.handle)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                      <div className="font-medium">{displayName}</div>

                      <div className="text-sm text-muted-foreground">
                        <span className="font-mono">{handle}</span>
                        <span className="mx-2">•</span>
                        <span className="font-mono break-all">{c.userDid}</span>
                      </div>

                      {profile?.description ? (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {profile.description}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="secondary" className="capitalize">
                          {c.role}
                        </Badge>
                        {enabledPerms.map((p) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className="capitalize"
                          >
                            {p}
                          </Badge>
                        ))}
                      </div>

                      {removeMutation.isError && isThisRowPending === false ? (
                        <div className="text-sm text-destructive">
                          {(removeMutation.error as Error)?.message ??
                            "Failed to revoke access."}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {/* 
commented out for now revoke has some issues
                  <div className="flex gap-2">
                    <Button
                      onClick={revoke}
                      variant="destructive"
                      size="sm"
                      disabled={removeMutation.isPending}
                    >
                      {isThisRowPending ? "Revoking..." : "Revoke access"}
                    </Button>
                  </div> */}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
