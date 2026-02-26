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
        <div className="bg-create-accent/10 flex size-10 items-center justify-center rounded-full">
          <BarChart3 className="text-create-accent size-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
            Measurements
          </h3>
          {measurements && measurements.length > 0 ? (
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs">
              {measurements.length}{" "}
              {measurements.length === 1 ? "measurement" : "measurements"}
            </p>
          ) : null}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <MeasurementSkeleton />
          <MeasurementSkeleton />
        </div>
      ) : null}

      {isError ? (
        <div className="glass-panel rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="font-[family-name:var(--font-outfit)] text-sm text-red-500">
            Failed to load measurements.
          </p>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <>
          {measurements && measurements.length > 0 ? (
            <div className="stagger-children space-y-4">
              {measurements.map((measurement, index) => (
                <HypercertMeasurementView
                  key={index}
                  measurement={measurement}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel border-border/50 rounded-xl border p-8 text-center">
              <BarChart3 className="text-muted-foreground/30 mx-auto mb-3 size-12" />
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
                No measurements found for this hypercert.
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
