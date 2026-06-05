"use client";

import { CalendarDays, ExternalLink, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DisplayContributor } from "@/lib/contributor-utils";
import type { BlueskyProfile } from "@/lib/api/types";

interface HypercertContributorViewProps {
  contributor: DisplayContributor;
  profile?: BlueskyProfile; // resolved Bluesky profile, if available
}

function formatContributionDate(value?: string): string | undefined {
  if (!value) return undefined;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function getContributorHref(
  identity: string,
  isDid: boolean,
): string | undefined {
  if (isDid) return `https://bsky.app/profile/${identity}`;
  if (/^https?:\/\//i.test(identity)) return identity;
  if (
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9-]+)+$/i.test(identity)
  ) {
    return `https://${identity}`;
  }
  return undefined;
}

export default function HypercertContributorView({
  contributor,
  profile,
}: HypercertContributorViewProps) {
  const displayName =
    profile?.displayName || contributor.displayName || contributor.identity;
  const identifierLabel = profile?.handle
    ? `@${profile.handle}`
    : displayName !== contributor.identity
      ? contributor.identity
      : undefined;
  const started = formatContributionDate(contributor.startDate);
  const ended = formatContributionDate(contributor.endDate);
  const timeframe =
    started && ended ? `${started} – ${ended}` : started || ended;
  const contributorHref = getContributorHref(
    contributor.identity,
    contributor.isDid,
  );

  return (
    <Card className="glass-panel border-border/50 hover:border-create-accent/40 overflow-hidden rounded-xl border transition-colors">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            {profile?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt={displayName}
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

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-syne)] text-sm leading-tight font-semibold">
                  <span className="block truncate">{displayName}</span>
                </p>
                {identifierLabel ? (
                  <p className="text-muted-foreground truncate font-[family-name:var(--font-outfit)] text-xs">
                    {identifierLabel}
                  </p>
                ) : null}
              </div>

              {contributorHref ? (
                <a
                  href={contributorHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-create-accent inline-flex shrink-0 items-center gap-1 font-[family-name:var(--font-outfit)] text-xs transition-colors"
                >
                  Open
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>

            {(contributor.role || contributor.weight) && (
              <div className="flex flex-wrap items-center gap-2">
                {contributor.role ? (
                  <span className="bg-create-accent/10 text-create-accent border-create-accent/20 inline-flex items-center rounded-full border px-2 py-0.5 font-[family-name:var(--font-outfit)] text-xs">
                    {contributor.role}
                  </span>
                ) : null}
                {contributor.weight ? (
                  <span className="border-border/60 text-muted-foreground inline-flex items-center rounded-full border px-2 py-0.5 font-[family-name:var(--font-outfit)] text-xs">
                    Weight {contributor.weight}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {contributor.contributionDescription ? (
          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm leading-relaxed">
            {contributor.contributionDescription}
          </p>
        ) : null}

        {timeframe ? (
          <div className="text-muted-foreground flex items-center gap-1.5 font-[family-name:var(--font-outfit)] text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{timeframe}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
