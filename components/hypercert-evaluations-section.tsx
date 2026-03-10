"use client";

import { useMemo } from "react";
import HypercertEvaluationView, {
  Evaluation,
} from "./hypercert-evaluation-view";
import { Skeleton } from "./ui/skeleton";
import {
  useEvaluationLinksQuery,
  useEvaluationRecordsQuery,
  useDeleteRecordMutation,
} from "@/queries/hypercerts";
import { ClipboardCheck, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";

interface EvaluationWithUri {
  evaluation: Evaluation;
  recordUri: string;
}

function isEvaluation(value: unknown): value is Evaluation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.summary === "string" &&
    typeof v.createdAt === "string" &&
    Array.isArray(v.evaluators)
  );
}

const EvaluationSkeleton = () => (
  <div className="glass-panel border-border/50 space-y-4 rounded-xl border p-6">
    <Skeleton className="h-6 w-1/4" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-16 w-32 rounded-lg" />
  </div>
);

export default function HypercertEvaluationsSection({
  hypercertUri,
  isOwner,
}: {
  hypercertUri: string;
  isOwner?: boolean;
}) {
  const queryClient = useQueryClient();

  const {
    data: evaluationLinks,
    isLoading: isLoadingLinks,
    isError: isErrorLinks,
  } = useEvaluationLinksQuery(hypercertUri);

  const evaluationQueries = useEvaluationRecordsQuery(evaluationLinks);

  const { isLoadingDetails, isErrorDetails, evaluationsWithUris } =
    useMemo(() => {
      let loading = false;
      let error = false;
      const items: EvaluationWithUri[] = [];
      for (let i = 0; i < evaluationQueries.length; i++) {
        const q = evaluationQueries[i];
        if (q.isLoading) loading = true;
        if (q.isError) error = true;
        if (q.isSuccess && q.data && evaluationLinks?.[i]) {
          const link = evaluationLinks[i];
          const recordUri = `at://${link.did}/${link.collection}/${link.rkey}`;
          if (isEvaluation(q.data.value)) {
            items.push({
              evaluation: q.data.value,
              recordUri,
            });
          }
        }
      }
      return {
        isLoadingDetails: loading,
        isErrorDetails: error,
        evaluationsWithUris: items,
      };
    }, [evaluationQueries, evaluationLinks]);

  const deleteRecordMutation = useDeleteRecordMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.hypercerts.evaluations(hypercertUri),
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
          <ClipboardCheck className="text-create-accent size-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
            Evaluations
          </h3>
          {evaluationsWithUris && evaluationsWithUris.length > 0 ? (
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs">
              {evaluationsWithUris.length}{" "}
              {evaluationsWithUris.length === 1 ? "evaluation" : "evaluations"}
            </p>
          ) : null}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <EvaluationSkeleton />
        </div>
      ) : null}

      {isError ? (
        <div className="glass-panel rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="font-[family-name:var(--font-outfit)] text-sm text-red-500">
            Failed to load evaluations.
          </p>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <>
          {evaluationsWithUris && evaluationsWithUris.length > 0 ? (
            <div className="stagger-children space-y-4">
              {evaluationsWithUris.map(({ evaluation, recordUri }, index) => (
                <HypercertEvaluationView
                  key={index}
                  evaluation={evaluation}
                  actions={
                    isOwner ? (
                      <DeleteConfirmDialog
                        itemType="evaluation"
                        itemName={evaluation.summary}
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
              <ClipboardCheck className="text-muted-foreground/30 mx-auto mb-3 size-12" />
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
                No evaluations found for this hypercert.
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
              href={`/hypercerts/${encodeURIComponent(hypercertUri)}/add/evaluation`}
            >
              <Plus className="h-4 w-4" /> Add Evaluation
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
