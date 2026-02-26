"use client";

import { useMemo } from "react";
import HypercertEvaluationView, {
  Evaluation,
} from "./hypercert-evaluation-view";
import { Skeleton } from "./ui/skeleton";
import {
  useEvaluationLinksQuery,
  useEvaluationRecordsQuery,
} from "@/queries/hypercerts";
import { ClipboardCheck } from "lucide-react";

const EvaluationSkeleton = () => (
  <div className="glass-panel border-border/50 space-y-4 rounded-xl border p-6">
    <Skeleton className="h-6 w-1/4" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-16 w-32 rounded-lg" />
  </div>
);

export default function HypercertEvaluationsSection({
  hypercertUri,
}: {
  hypercertUri: string;
}) {
  const {
    data: evaluationLinks,
    isLoading: isLoadingLinks,
    isError: isErrorLinks,
  } = useEvaluationLinksQuery(hypercertUri);

  const evaluationQueries = useEvaluationRecordsQuery(evaluationLinks);

  const { isLoadingDetails, isErrorDetails, evaluations } = useMemo(() => {
    let loading = false;
    let error = false;
    const items: Evaluation[] = [];
    for (const q of evaluationQueries) {
      if (q.isLoading) loading = true;
      if (q.isError) error = true;
      if (q.isSuccess && q.data) items.push(q.data.value as Evaluation);
    }
    return {
      isLoadingDetails: loading,
      isErrorDetails: error,
      evaluations: items,
    };
  }, [evaluationQueries]);

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
          {evaluations && evaluations.length > 0 ? (
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs">
              {evaluations.length}{" "}
              {evaluations.length === 1 ? "evaluation" : "evaluations"}
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
          {evaluations && evaluations.length > 0 ? (
            <div className="stagger-children space-y-4">
              {evaluations.map((evaluation, index) => (
                <HypercertEvaluationView key={index} evaluation={evaluation} />
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
    </div>
  );
}
