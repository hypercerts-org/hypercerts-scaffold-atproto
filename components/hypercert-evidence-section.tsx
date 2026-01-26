"use client";

import HypercertEvidenceView, { Evidence } from "./hypercert-evidence-view";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import {
  useEvidenceLinksQuery,
  useEvidenceRecordsQuery,
} from "@/queries/hypercerts";

const EvidenceSkeleton = () => (
  <div className="p-4 border rounded-lg space-y-3">
    <div className="flex justify-between items-start">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-5 w-20" />
    </div>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export default function HypercertEvidenceSection({
  hypercertUri,
}: {
  hypercertUri: string;
}) {
  const {
    data: evidenceLinks,
    isLoading: isLoadingLinks,
    isError: isErrorLinks,
  } = useEvidenceLinksQuery(hypercertUri);

  const evidenceQueries = useEvidenceRecordsQuery(evidenceLinks);

  const isLoadingDetails = evidenceQueries.some((q) => q.isLoading);
  const isErrorDetails = evidenceQueries.some((q) => q.isError);
  const isLoading = isLoadingLinks || isLoadingDetails;
  const isError = isErrorLinks || isErrorDetails;

  const evidences = evidenceQueries
    .filter((q) => q.isSuccess && q.data)
    .map((q) => q.data?.value as Evidence);

  return (
    <div>
      <Separator className="my-6" />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Evidence</h3>
        {isLoading && (
          <div className="space-y-4">
            <EvidenceSkeleton />
            <EvidenceSkeleton />
          </div>
        )}
        {isError && (
          <p className="text-sm text-red-500">Failed to load evidence.</p>
        )}
        {!isLoading && !isError && (
          <>
            {evidences && evidences.length > 0 ? (
              <div className="space-y-4">
                {evidences.map((evidence, index) => (
                  <HypercertEvidenceView key={index} evidence={evidence} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No evidence found for this hypercert.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
