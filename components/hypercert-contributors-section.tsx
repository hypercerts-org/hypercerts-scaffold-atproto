"use client";

import type { OrgHypercertsClaimActivity } from "@hypercerts-org/sdk-core";
import { Users } from "lucide-react";
import { parseContributors } from "@/lib/contributor-utils";
import { useContributorProfilesQuery } from "@/queries/hypercerts";
import HypercertContributorView from "./hypercert-contributor-view";
import { Skeleton } from "./ui/skeleton";

type Contributor = OrgHypercertsClaimActivity.Contributor;

interface HypercertContributorsSectionProps {
  contributors?: Contributor[];
}

const ContributorSkeleton = () => (
  <div className="glass-panel p-4 border border-border/50 rounded-xl flex items-center gap-3">
    <Skeleton className="size-10 rounded-full" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  </div>
);

export default function HypercertContributorsSection({
  contributors,
}: HypercertContributorsSectionProps) {
  const displayContributors = parseContributors(contributors);
  const { profileMap, isLoading } = useContributorProfilesQuery(displayContributors);

  const didContributors = displayContributors.filter((c) => c.isDid);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center">
          <Users className="size-5 text-create-accent" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-[family-name:var(--font-syne)] font-semibold">
            Contributors
          </h3>
          <p className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground">
            {displayContributors.length}{" "}
            {displayContributors.length === 1 ? "contributor" : "contributors"}
          </p>
        </div>
      </div>

      {/* Loading state — only shown while DID profiles are resolving */}
      {isLoading && didContributors.length > 0 && (
        <div className="space-y-3">
          {didContributors.map((_, index) => (
            <ContributorSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {displayContributors.length > 0 ? (
            <div className="space-y-3 stagger-children">
              {displayContributors.map((contributor, index) => (
                <HypercertContributorView
                  key={index}
                  contributor={contributor}
                  profile={profileMap.get(contributor.identity)}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-8 border border-border/50 text-center">
              <Users className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
                No contributors listed for this hypercert.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
