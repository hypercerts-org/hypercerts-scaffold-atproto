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
        <div className="bg-create-accent/10 flex size-10 items-center justify-center rounded-full">
          <BarChart3 className="text-create-accent size-5" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1 h-3 w-24" />
        </div>
      </div>

      {/* 2 measurement card skeletons */}
      <div className="space-y-4">
        <div className="glass-panel border-border/50 space-y-4 rounded-xl border p-6">
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
        <div className="glass-panel border-border/50 space-y-4 rounded-xl border p-6">
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
        <div className="bg-create-accent/10 flex size-10 items-center justify-center rounded-full">
          <FileCheck className="text-create-accent size-5" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1 h-3 w-24" />
        </div>
      </div>

      {/* 2 evidence card skeletons */}
      <div className="space-y-4">
        <div className="glass-panel border-border/50 space-y-4 rounded-xl border p-6">
          <div className="flex items-start justify-between">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="glass-panel border-border/50 space-y-4 rounded-xl border p-6">
          <div className="flex items-start justify-between">
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
        <div className="bg-create-accent/10 flex size-10 items-center justify-center rounded-full">
          <ClipboardCheck className="text-create-accent size-5" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1 h-3 w-24" />
        </div>
      </div>

      {/* 1 evaluation card skeleton */}
      <div className="space-y-4">
        <div className="glass-panel border-border/50 space-y-4 rounded-xl border p-6">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-16 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
