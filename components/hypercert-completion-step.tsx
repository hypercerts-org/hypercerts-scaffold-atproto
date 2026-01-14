"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, ArrowLeft, Plus } from "lucide-react";
import { BaseHypercertFormProps } from "@/lib/types";

export default function HypercertCompletionStep({
  hypercertInfo,
  onBack,
  onCreateAnother,
}: BaseHypercertFormProps & {
  onBack?: () => void;
  onCreateAnother?: () => void;
}) {
  const viewHref = hypercertInfo?.hypercertUri
    ? `/hypercerts/${encodeURIComponent(hypercertInfo.hypercertUri)}`
    : "/hypercerts";
  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 p-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-2xl mt-1">
                  Hypercert created!
                </CardTitle>
                <CardDescription className="mt-1">
                  Your hypercert is now live. You can view it, share it, or
                  start creating another one.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {hypercertInfo?.hypercertCid ? (
              <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <span className="font-mono text-xs">CID:</span>{" "}
                <span className="font-mono break-all">
                  {hypercertInfo.hypercertCid}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                We couldn&apos;t resolve a specific hypercert ID, but your
                record should now be available in your hypercerts list.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}

              {hypercertInfo?.hypercertCid && (
                <Link href={viewHref}>
                  <Button className="gap-2">View hypercert</Button>
                </Link>
              )}

              {onCreateAnother && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={onCreateAnother}
                >
                  <Plus className="h-4 w-4" />
                  Create another
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
