"use client";
import { useQuery, useQueries } from "@tanstack/react-query";
import HypercertEvidenceView, { Evidence } from "./hypercert-evidence-view";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { getEvidenceRecord } from "@/lib/create-actions";

interface BacklinksResponse {
  records: {
    did: string;
    collection: string;
    rkey: string;
  }[];
}

const fetchEvidenceLinks = async (
  hypercertUri: string
): Promise<BacklinksResponse["records"]> => {
  const url = new URL(
    "https://constellation.microcosm.blue/xrpc/blue.microcosm.links.getBacklinks"
  );
  url.searchParams.set("subject", hypercertUri);
  url.searchParams.set("source", "org.hypercerts.claim.evidence:subject.uri");
  url.searchParams.set("limit", "50");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data: BacklinksResponse = await response.json();
  return data.records;
};

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
  } = useQuery({
    queryKey: ["evidence-links", hypercertUri],
    queryFn: () => fetchEvidenceLinks(hypercertUri),
  });

  const evidenceQueries = useQueries({
    queries: (evidenceLinks || []).map((link) => ({
      queryKey: ["evidence-record", link.did, link.rkey],
      queryFn: () =>
        getEvidenceRecord({
          did: link.did,
          collection: link.collection,
          rkey: link.rkey,
        }),
    })),
  });

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
