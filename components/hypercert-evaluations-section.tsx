"use client";

import { useMemo } from "react";
import HypercertEvaluationView, {
  Evaluation,
} from "./hypercert-evaluation-view";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import {
  useEvaluationLinksQuery,
  useEvaluationRecordsQuery,
} from "@/queries/hypercerts";
import { ClipboardCheck } from "lucide-react";

const EvaluationSkeleton = () => (
  <div className="glass-panel p-6 border border-border/50 rounded-xl space-y-4">
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
        <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center">
          <ClipboardCheck className="size-5 text-create-accent" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-[family-name:var(--font-syne)] font-semibold">
            Evaluations
          </h3>
          {evaluations && evaluations.length > 0 && (
            <p className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground">
              {evaluations.length}{" "}
              {evaluations.length === 1 ? "evaluation" : "evaluations"}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="space-y-4">
          <EvaluationSkeleton />
        </div>
      )}

      {isError && (
        <div className="glass-panel rounded-xl p-6 border border-red-500/20 bg-red-500/5">
          <p className="text-sm font-[family-name:var(--font-outfit)] text-red-500">
            Failed to load evaluations.
          </p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {evaluations && evaluations.length > 0 ? (
            <div className="space-y-4 stagger-children">
              {evaluations.map((evaluation, index) => (
                <HypercertEvaluationView key={index} evaluation={evaluation} />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-8 border border-border/50 text-center">
              <ClipboardCheck className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
                No evaluations found for this hypercert.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
