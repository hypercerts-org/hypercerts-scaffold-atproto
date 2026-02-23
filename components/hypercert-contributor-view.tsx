"use client";

import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DisplayContributor } from "@/lib/contributor-utils";
import type { BlueskyProfile } from "@/lib/api/types";

interface HypercertContributorViewProps {
  contributor: DisplayContributor;
  profile?: BlueskyProfile; // resolved Bluesky profile, if available
}

export default function HypercertContributorView({
  contributor,
  profile,
}: HypercertContributorViewProps) {
  const cardContent = (
    <CardContent className="py-4">
      <div className="flex items-center gap-3">
        {/* Avatar area */}
        <div className="shrink-0">
          {profile?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar}
              alt={profile.displayName ?? contributor.identity}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-create-accent/10 flex items-center justify-center">
              <User className="size-5 text-create-accent" />
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Name line */}
          <p className="text-sm font-[family-name:var(--font-syne)] font-semibold leading-tight">
            {profile?.displayName ? (
              profile.displayName
            ) : contributor.displayName ? (
              contributor.displayName
            ) : (
              <span className="truncate block max-w-[200px]">
                {contributor.identity}
              </span>
            )}
          </p>

          {/* Handle/DID line */}
          {(profile?.handle || contributor.isDid) && (
            <p className="text-xs text-muted-foreground font-[family-name:var(--font-outfit)] truncate">
              {profile?.handle
                ? `@${profile.handle}`
                : contributor.identity}
            </p>
          )}

          {/* Role badge */}
          {contributor.role && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-[family-name:var(--font-outfit)] bg-create-accent/10 text-create-accent border border-create-accent/20">
              {contributor.role}
            </span>
          )}
        </div>

        {/* Weight area */}
        {contributor.weight && (
          <div className="shrink-0 text-right">
            <p className="text-lg font-[family-name:var(--font-syne)] font-bold text-create-accent leading-tight">
              {contributor.weight}
            </p>
            <p className="text-xs text-muted-foreground font-[family-name:var(--font-outfit)]">
              weight
            </p>
          </div>
        )}
      </div>
    </CardContent>
  );

  return (
    <Card className="glass-panel rounded-xl border border-border/50 hover:border-create-accent/40 transition-colors overflow-hidden">
      {contributor.isDid ? (
        <a
          href={`https://bsky.app/profile/${contributor.identity}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {cardContent}
        </a>
      ) : (
        cardContent
      )}
    </Card>
  );
}
