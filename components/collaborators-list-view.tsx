"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { RepositoryAccessGrant } from "@hypercerts-org/sdk-core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";

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
        queryKey: ["organizations", repoDid],
      });
    },
  });

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-create-accent/10 flex items-center justify-center">
            <Users className="size-4 text-create-accent" />
          </div>
          <div>
            <h3 className="text-lg font-[family-name:var(--font-syne)] font-bold tracking-tight text-foreground">
              Collaborators
            </h3>
            <p className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground">
              People who currently have access to this organization
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        {activeCollaborators.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
              <Users className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
              No collaborators found.
            </p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {activeCollaborators.map((c) => {
              const enabledPerms = Object.entries(c.permissions ?? {})
                .filter(([, v]) => Boolean(v))
                .map(([k]) => k);

              const profile = c.userProfile ?? null;
              const displayName =
                profile?.displayName?.trim() || profile?.handle || c.userDid;
              const handle = profile?.handle ? `@${profile.handle}` : null;

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
                  className="flex flex-col gap-3 rounded-xl border border-border/40 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between hover:border-create-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10 border border-border/50">
                      {profile?.avatar ? (
                        <AvatarImage src={profile.avatar} alt={displayName} />
                      ) : null}
                      <AvatarFallback className="bg-create-accent/10 text-create-accent font-[family-name:var(--font-syne)] text-xs font-bold">
                        {initials(profile?.displayName || profile?.handle)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1.5 min-w-0">
                      <div className="font-[family-name:var(--font-syne)] font-semibold text-sm text-foreground">
                        {displayName}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-outfit)] text-muted-foreground">
                        {handle && (
                          <>
                            <span className="font-medium">{handle}</span>
                            <span className="text-border">|</span>
                          </>
                        )}
                        <span className="font-mono break-all">
                          {c.userDid}
                        </span>
                      </div>

                      {profile?.description ? (
                        <p className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground line-clamp-1 leading-relaxed">
                          {profile.description}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-outfit)] font-medium bg-create-accent/10 text-create-accent border border-create-accent/20 capitalize">
                          {c.role}
                        </span>
                        {enabledPerms.map((p) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className="capitalize text-[10px] font-[family-name:var(--font-outfit)]"
                          >
                            {p}
                          </Badge>
                        ))}
                      </div>

                      {removeMutation.isError &&
                      isThisRowPending === false ? (
                        <div className="text-xs font-[family-name:var(--font-outfit)] text-destructive">
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
                      className="font-[family-name:var(--font-outfit)] text-xs"
                    >
                      {isThisRowPending ? "Revoking..." : "Revoke access"}
                    </Button>
                  </div> */}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
