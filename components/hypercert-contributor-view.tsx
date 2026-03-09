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
            <div className="bg-create-accent/10 flex h-10 w-10 items-center justify-center rounded-full">
              <User className="text-create-accent size-5" />
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Name line */}
          <p className="font-[family-name:var(--font-syne)] text-sm leading-tight font-semibold">
            {profile?.displayName ? (
              profile.displayName
            ) : contributor.displayName ? (
              contributor.displayName
            ) : (
              <span className="block max-w-[200px] truncate">
                {contributor.identity}
              </span>
            )}
          </p>

          {/* Handle/DID line */}
          {(profile?.handle || contributor.isDid) && (
            <p className="text-muted-foreground truncate font-[family-name:var(--font-outfit)] text-xs">
              {profile?.handle ? `@${profile.handle}` : contributor.identity}
            </p>
          )}

          {/* Role badge */}
          {contributor.role && (
            <span className="bg-create-accent/10 text-create-accent border-create-accent/20 inline-flex items-center rounded-full border px-2 py-0.5 font-[family-name:var(--font-outfit)] text-xs">
              {contributor.role}
            </span>
          )}
        </div>

        {/* Weight area */}
        {contributor.weight && (
          <div className="shrink-0 text-right">
            <p className="text-create-accent font-[family-name:var(--font-syne)] text-lg leading-tight font-bold">
              {contributor.weight}
            </p>
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs">
              weight
            </p>
          </div>
        )}
      </div>
    </CardContent>
  );

  return (
    <Card className="glass-panel border-border/50 hover:border-create-accent/40 overflow-hidden rounded-xl border transition-colors">
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
