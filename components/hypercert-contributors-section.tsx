"use client";

import type { OrgHypercertsClaimActivity } from "@hypercerts-org/sdk-core";
import { Users } from "lucide-react";
import { useMemo } from "react";
import { parseContributors } from "@/lib/contributor-utils";
import {
  useContributorProfilesQuery,
  useResolveContributorIdentities,
} from "@/queries/hypercerts";
import HypercertContributorView from "./hypercert-contributor-view";
import { Skeleton } from "./ui/skeleton";

type Contributor = OrgHypercertsClaimActivity.Contributor;

interface HypercertContributorsSectionProps {
  contributors?: Contributor[];
  hypercertUri?: string;
  isOwner?: boolean;
}

const ContributorSkeleton = () => (
  <div className="glass-panel border-border/50 flex items-center gap-3 rounded-xl border p-4">
    <Skeleton className="size-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  </div>
);

export default function HypercertContributorsSection({
  contributors,
}: HypercertContributorsSectionProps) {
  const displayContributors = parseContributors(contributors);

  // Phase 1: Resolve StrongRef identities to actual DIDs
  const { resolvedMap, isLoading: isResolvingIdentities } =
    useResolveContributorIdentities(displayContributors);

  // Build resolved contributors list — replace placeholder identities with actual DIDs
  const resolvedContributors = useMemo(() => {
    return displayContributors.map((c) => {
      if (c.needsResolution && resolvedMap.has(c.identity)) {
        const resolved = resolvedMap.get(c.identity)!;
        return {
          ...c,
          identity: resolved.identifier,
          isDid: resolved.identifier.startsWith("did:"),
          displayName: resolved.displayName,
          needsResolution: false,
        };
      }
      return c;
    });
  }, [displayContributors, resolvedMap]);

  // Phase 2: Resolve DIDs to Bluesky profiles
  const { profileMap, isLoading: isLoadingProfiles } =
    useContributorProfilesQuery(resolvedContributors);

  const isLoading = isResolvingIdentities || isLoadingProfiles;

  const didContributors = resolvedContributors.filter((c) => c.isDid);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="bg-create-accent/10 flex size-10 items-center justify-center rounded-full">
          <Users className="text-create-accent size-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
            Contributors
          </h3>
          {displayContributors.length > 0 ? (
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs">
              {displayContributors.length}{" "}
              {displayContributors.length === 1
                ? "contributor"
                : "contributors"}
            </p>
          ) : null}
        </div>
      </div>

      {/* Loading state — shown while resolving StrongRef identities or DID profiles */}
      {isLoading &&
        (didContributors.length > 0 ||
          displayContributors.some((c) => c.needsResolution)) && (
          <div className="space-y-3">
            {(didContributors.length > 0
              ? didContributors
              : displayContributors
            ).map((_, index) => (
              <ContributorSkeleton key={index} />
            ))}
          </div>
        )}

      {/* Content */}
      {!isLoading && (
        <>
          {resolvedContributors.length > 0 ? (
            <div className="stagger-children space-y-3">
              {resolvedContributors.map((contributor, index) => (
                <HypercertContributorView
                  key={index}
                  contributor={contributor}
                  profile={profileMap.get(contributor.identity)}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel border-border/50 rounded-xl border p-8 text-center">
              <Users className="text-muted-foreground/30 mx-auto mb-3 size-12" />
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
                No contributors listed for this hypercert.
              </p>
            </div>
          )}
        </>
      )}

      {/* Add Contributor button is intentionally hidden until the contribution form is implemented */}
    </div>
  );
}
