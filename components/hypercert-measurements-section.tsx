"use client";

import { useMemo } from "react";
import HypercertMeasurementView, {
  Measurement,
} from "./hypercert-measurement-view";
import { Skeleton } from "./ui/skeleton";
import {
  useMeasurementLinksQuery,
  useMeasurementRecordsQuery,
} from "@/queries/hypercerts";
import { BarChart3 } from "lucide-react";

const MeasurementSkeleton = () => (
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
);

export default function HypercertMeasurementsSection({
  hypercertUri,
}: {
  hypercertUri: string;
}) {
  const {
    data: measurementLinks,
    isLoading: isLoadingLinks,
    isError: isErrorLinks,
  } = useMeasurementLinksQuery(hypercertUri);

  const measurementQueries = useMeasurementRecordsQuery(measurementLinks);

  const { isLoadingDetails, isErrorDetails, measurements } = useMemo(() => {
    let loading = false;
    let error = false;
    const items: Measurement[] = [];
    for (const q of measurementQueries) {
      if (q.isLoading) loading = true;
      if (q.isError) error = true;
      if (q.isSuccess && q.data) items.push(q.data.value as Measurement);
    }
    return {
      isLoadingDetails: loading,
      isErrorDetails: error,
      measurements: items,
    };
  }, [measurementQueries]);

  const isLoading = isLoadingLinks || isLoadingDetails;
  const isError = isErrorLinks || isErrorDetails;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center">
          <BarChart3 className="size-5 text-create-accent" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-[family-name:var(--font-syne)] font-semibold">
            Measurements
          </h3>
          {measurements && measurements.length > 0 && (
            <p className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground">
              {measurements.length}{" "}
              {measurements.length === 1 ? "measurement" : "measurements"}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="space-y-4">
          <MeasurementSkeleton />
          <MeasurementSkeleton />
        </div>
      )}

      {isError && (
        <div className="glass-panel rounded-xl p-6 border border-red-500/20 bg-red-500/5">
          <p className="text-sm font-[family-name:var(--font-outfit)] text-red-500">
            Failed to load measurements.
          </p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {measurements && measurements.length > 0 ? (
            <div className="space-y-4 stagger-children">
              {measurements.map((measurement, index) => (
                <HypercertMeasurementView
                  key={index}
                  measurement={measurement}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-8 border border-border/50 text-center">
              <BarChart3 className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
                No measurements found for this hypercert.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
