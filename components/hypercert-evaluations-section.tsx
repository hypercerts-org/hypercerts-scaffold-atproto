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

const EvaluationSkeleton = () => (
  <div className="p-4 border rounded-lg space-y-3">
    <Skeleton className="h-5 w-1/4" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
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
    return { isLoadingDetails: loading, isErrorDetails: error, evaluations: items };
  }, [evaluationQueries]);

  const isLoading = isLoadingLinks || isLoadingDetails;
  const isError = isErrorLinks || isErrorDetails;

  return (
    <div>
      <Separator className="my-6" />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Evaluations</h3>
        {isLoading && (
          <div className="space-y-4">
            <EvaluationSkeleton />
          </div>
        )}
        {isError && (
          <p className="text-sm text-red-500">Failed to load evaluations.</p>
        )}
        {!isLoading && !isError && (
          <>
            {evaluations && evaluations.length > 0 ? (
              <div className="space-y-4">
                {evaluations.map((evaluation, index) => (
                  <HypercertEvaluationView
                    key={index}
                    evaluation={evaluation}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No evaluations found for this hypercert.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
