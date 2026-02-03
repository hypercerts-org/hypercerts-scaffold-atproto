"use client";

import { useMemo } from "react";
import HypercertMeasurementView, {
  Measurement,
} from "./hypercert-measurement-view";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import {
  useMeasurementLinksQuery,
  useMeasurementRecordsQuery,
} from "@/queries/hypercerts";

const MeasurementSkeleton = () => (
  <div className="p-4 border rounded-lg space-y-3">
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-8 w-1/2" />
    <div className="grid grid-cols-2 gap-4 pt-2">
      <div className="space-y-1">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-4 w-1/4" />
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
    return { isLoadingDetails: loading, isErrorDetails: error, measurements: items };
  }, [measurementQueries]);

  const isLoading = isLoadingLinks || isLoadingDetails;
  const isError = isErrorLinks || isErrorDetails;

  return (
    <div>
      <Separator className="my-6" />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Measurements</h3>
        {isLoading && (
          <div className="space-y-4">
            <MeasurementSkeleton />
            <MeasurementSkeleton />
          </div>
        )}
        {isError && (
          <p className="text-sm text-red-500">Failed to load measurements.</p>
        )}
        {!isLoading && !isError && (
          <>
            {measurements && measurements.length > 0 ? (
              <div className="space-y-4">
                {measurements.map((measurement, index) => (
                  <HypercertMeasurementView
                    key={index}
                    measurement={measurement}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No measurements found for this hypercert.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
