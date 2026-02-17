"use client";

import { useMemo } from "react";
import HypercertEvidenceView from "./hypercert-evidence-view";
import { Skeleton } from "./ui/skeleton";
import {
  useEvidenceLinksQuery,
  useEvidenceRecordsQuery,
} from "@/queries/hypercerts";
import { FileCheck } from "lucide-react";
import { OrgHypercertsClaimAttachment } from "@hypercerts-org/sdk-core";

type Attachment = OrgHypercertsClaimAttachment.Main;

const EvidenceSkeleton = () => (
  <div className="glass-panel p-6 border border-border/50 rounded-xl space-y-4">
    <div className="flex justify-between items-start">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-6 w-20 rounded-full" />
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

  const { isLoadingDetails, isErrorDetails, evidences } = useMemo(() => {
    let loading = false;
    let error = false;
    const items: Attachment[] = [];
    for (const query of evidenceQueries) {
      if (query.isLoading) loading = true;
      if (query.isError) error = true;
      if (query.isSuccess && query.data)
        items.push(query.data.value as Attachment);
    }
    return {
      isLoadingDetails: loading,
      isErrorDetails: error,
      evidences: items,
    };
  }, [evidenceQueries]);

  const isLoading = isLoadingLinks || isLoadingDetails;
  const isError = isErrorLinks || isErrorDetails;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center">
          <FileCheck className="size-5 text-create-accent" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-[family-name:var(--font-syne)] font-semibold">
            Evidence
          </h3>
          {evidences && evidences.length > 0 && (
            <p className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground">
              {evidences.length} {evidences.length === 1 ? "piece" : "pieces"}{" "}
              of evidence
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="space-y-4">
          <EvidenceSkeleton />
          <EvidenceSkeleton />
        </div>
      )}

      {isError && (
        <div className="glass-panel rounded-xl p-6 border border-red-500/20 bg-red-500/5">
          <p className="text-sm font-[family-name:var(--font-outfit)] text-red-500">
            Failed to load evidence.
          </p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {evidences && evidences.length > 0 ? (
            <div className="space-y-4 stagger-children">
              {evidences.map((evidence, index) => (
                <HypercertEvidenceView key={index} evidence={evidence} />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-8 border border-border/50 text-center">
              <FileCheck className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
                No evidence found for this hypercert.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
