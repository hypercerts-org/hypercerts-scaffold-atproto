"use client";

import { useMemo } from "react";
import HypercertEvidenceView from "./hypercert-evidence-view";
import { Skeleton } from "./ui/skeleton";
import {
  useEvidenceLinksQuery,
  useEvidenceRecordsQuery,
  useDeleteRecordMutation,
} from "@/queries/hypercerts";
import { FileCheck, Plus } from "lucide-react";
import { OrgHypercertsClaimAttachment } from "@hypercerts-org/lexicon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";

type Attachment = OrgHypercertsClaimAttachment.Main;

interface EvidenceWithUri {
  evidence: Attachment;
  recordUri: string;
}

const EvidenceSkeleton = () => (
  <div className="glass-panel border-border/50 space-y-4 rounded-xl border p-6">
    <div className="flex items-start justify-between">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export default function HypercertEvidenceSection({
  hypercertUri,
  isOwner,
}: {
  hypercertUri: string;
  isOwner?: boolean;
}) {
  const queryClient = useQueryClient();

  const {
    data: evidenceLinks,
    isLoading: isLoadingLinks,
    isError: isErrorLinks,
  } = useEvidenceLinksQuery(hypercertUri);

  const evidenceQueries = useEvidenceRecordsQuery(evidenceLinks);

  const { isLoadingDetails, isErrorDetails, evidencesWithUris } =
    useMemo(() => {
      let loading = false;
      let error = false;
      const items: EvidenceWithUri[] = [];
      for (let i = 0; i < evidenceQueries.length; i++) {
        const query = evidenceQueries[i];
        if (query.isLoading) loading = true;
        if (query.isError) error = true;
        if (query.isSuccess && query.data && evidenceLinks?.[i]) {
          const link = evidenceLinks[i];
          const recordUri = `at://${link.did}/${link.collection}/${link.rkey}`;
          items.push({
            evidence: query.data.value as Attachment,
            recordUri,
          });
        }
      }
      return {
        isLoadingDetails: loading,
        isErrorDetails: error,
        evidencesWithUris: items,
      };
    }, [evidenceQueries, evidenceLinks]);

  const deleteRecordMutation = useDeleteRecordMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.hypercerts.evidence(hypercertUri),
      });
    },
  });

  const isLoading = isLoadingLinks || isLoadingDetails;
  const isError = isErrorLinks || isErrorDetails;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="bg-create-accent/10 flex size-10 items-center justify-center rounded-full">
          <FileCheck className="text-create-accent size-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
            Evidence
          </h3>
          {evidencesWithUris && evidencesWithUris.length > 0 ? (
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs">
              {evidencesWithUris.length}{" "}
              {evidencesWithUris.length === 1 ? "piece" : "pieces"} of evidence
            </p>
          ) : null}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <EvidenceSkeleton />
          <EvidenceSkeleton />
        </div>
      ) : null}

      {isError ? (
        <div className="glass-panel rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="font-[family-name:var(--font-outfit)] text-sm text-red-500">
            Failed to load evidence.
          </p>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <>
          {evidencesWithUris && evidencesWithUris.length > 0 ? (
            <div className="stagger-children space-y-4">
              {evidencesWithUris.map(({ evidence, recordUri }, index) => (
                <HypercertEvidenceView
                  key={index}
                  evidence={evidence}
                  actions={
                    isOwner ? (
                      <DeleteConfirmDialog
                        itemType="evidence"
                        itemName={evidence.title || evidence.shortDescription}
                        isDeleting={
                          deleteRecordMutation.isPending &&
                          deleteRecordMutation.variables?.recordUri ===
                            recordUri
                        }
                        onConfirm={() =>
                          deleteRecordMutation.mutate({ recordUri })
                        }
                      />
                    ) : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel border-border/50 rounded-xl border p-8 text-center">
              <FileCheck className="text-muted-foreground/30 mx-auto mb-3 size-12" />
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
                No evidence found for this hypercert.
              </p>
            </div>
          )}
        </>
      ) : null}

      {isOwner && (
        <div className="pt-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 font-[family-name:var(--font-outfit)]"
          >
            <Link
              href={`/hypercerts/${encodeURIComponent(hypercertUri)}/add/evidence`}
            >
              <Plus className="h-4 w-4" /> Add Evidence
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
