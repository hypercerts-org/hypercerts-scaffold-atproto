import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, FileCheck, ClipboardCheck } from "lucide-react";

/**
 * Skeleton loaders for dynamically loaded detail-view section components.
 * These match the pixel-perfect layout of each section including the section
 * header and card layouts.
 */

export function MeasurementsSectionSkeleton() {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center">
          <BarChart3 className="size-5 text-create-accent" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
      </div>

      {/* 2 measurement card skeletons */}
      <div className="space-y-4">
        <div className="glass-panel p-6 border border-border/50 rounded-xl space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
        <div className="glass-panel p-6 border border-border/50 rounded-xl space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EvidenceSectionSkeleton() {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center">
          <FileCheck className="size-5 text-create-accent" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
      </div>

      {/* 2 evidence card skeletons */}
      <div className="space-y-4">
        <div className="glass-panel p-6 border border-border/50 rounded-xl space-y-4">
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="glass-panel p-6 border border-border/50 rounded-xl space-y-4">
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function EvaluationsSectionSkeleton() {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center">
          <ClipboardCheck className="size-5 text-create-accent" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
      </div>

      {/* 1 evaluation card skeleton */}
      <div className="space-y-4">
        <div className="glass-panel p-6 border border-border/50 rounded-xl space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-16 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
