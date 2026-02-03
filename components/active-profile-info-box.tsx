"use client";

import { useActiveProfile } from "@/queries/use-active-profile-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActiveProfileInfoBox() {
  const { data: activeProfile, isLoading, isError } = useActiveProfile();

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl p-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !activeProfile) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-xs font-[family-name:var(--font-outfit)] font-medium text-destructive">
          Could not load profile
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-4 animate-slide-in-left">
      <p className="text-[11px] uppercase tracking-wider font-[family-name:var(--font-outfit)] font-medium text-muted-foreground mb-2">
        Creating for
      </p>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-create-accent/15 flex items-center justify-center">
          <span className="text-xs font-[family-name:var(--font-syne)] font-bold text-create-accent">
            {activeProfile.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-[family-name:var(--font-outfit)] font-semibold truncate">
            {activeProfile.name}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            @{activeProfile.handle}
          </p>
        </div>
      </div>
    </div>
  );
}
