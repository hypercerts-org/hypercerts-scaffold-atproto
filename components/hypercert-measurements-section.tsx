"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import HypercertMeasurementView, {
  Measurement,
} from "./hypercert-measurement-view";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { getMeasurementRecord } from "@/lib/create-actions";

// The response from the backlinks API, which gives us references to records
interface BacklinksResponse {
  records: {
    did: string;
    collection: string;
    rkey: string;
  }[];
}

const fetchMeasurementLinks = async (
  hypercertUri: string
): Promise<BacklinksResponse["records"]> => {
  const url = new URL(
    "https://constellation.microcosm.blue/xrpc/blue.microcosm.links.getBacklinks"
  );
  url.searchParams.set("subject", hypercertUri);
  url.searchParams.set(
    "source",
    "org.hypercerts.claim.measurement:hypercert.uri"
  );
  url.searchParams.set("limit", "50");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data: BacklinksResponse = await response.json();
  return data.records;
};

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
  } = useQuery({
    queryKey: ["measurement-links", hypercertUri],
    queryFn: () => fetchMeasurementLinks(hypercertUri),
  });
  console.log(measurementLinks);

  const measurementQueries = useQueries({
    queries: (measurementLinks || []).map((link) => ({
      queryKey: ["measurement-record", link.did, link.rkey],
      queryFn: () =>
        getMeasurementRecord({
          did: link.did,
          collection: link.collection,
          rkey: link.rkey,
        }),
    })),
  });

  const isLoadingDetails = measurementQueries.some((q) => q.isLoading);
  const isErrorDetails = measurementQueries.some((q) => q.isError);
  const isLoading = isLoadingLinks || isLoadingDetails;
  const isError = isErrorLinks || isErrorDetails;

  const measurements = measurementQueries
    .filter((q) => q.isSuccess && q.data)
    .map((q) => q.data?.value as Measurement);

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
