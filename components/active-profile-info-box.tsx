"use client";

import { useActiveProfile } from "@/queries/use-active-profile-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActiveProfileInfoBox() {
  const { data: activeProfile, isLoading, isError } = useActiveProfile();

  if (isLoading) {
    return (
      <div className="glass-panel animate-fade-in rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !activeProfile) {
    return (
      <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-4">
        <p className="text-destructive font-[family-name:var(--font-outfit)] text-xs font-medium">
          Could not load profile
        </p>
        <p className="text-muted-foreground mt-1 text-[11px]">
          Try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-slide-in-left rounded-xl p-4">
      <p className="text-muted-foreground mb-2 font-[family-name:var(--font-outfit)] text-[11px] font-medium tracking-wider uppercase">
        Creating for
      </p>
      <div className="flex items-center gap-2">
        <div className="bg-create-accent/15 flex h-8 w-8 items-center justify-center rounded-full">
          <span className="text-create-accent font-[family-name:var(--font-syne)] text-xs font-bold">
            {activeProfile.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-outfit)] text-sm font-semibold">
            {activeProfile.name}
          </p>
          <p className="text-muted-foreground truncate text-[11px]">
            @{activeProfile.handle}
          </p>
        </div>
      </div>
    </div>
  );
}
