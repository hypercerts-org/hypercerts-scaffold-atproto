"use client";

import { getPDSlsURI } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { URILink } from "./uri-link";
import { Users, FileText, MapPin } from "lucide-react";

// Placeholder type based on the evaluation lexicon
export interface Evaluation {
  summary: string;
  createdAt: string;
  evaluators: (string | { did: string })[];
  score?: {
    min: number;
    max: number;
    value: number;
  };
  content?: string[];
  measurements?: string[];
  location?: string;
}

export default function HypercertEvaluationView({
  evaluation,
}: {
  evaluation?: Evaluation;
}) {
  if (!evaluation) {
    return null;
  }

  return (
    <Card className="glass-panel rounded-xl border border-border/50 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-[family-name:var(--font-syne)]">
          Evaluation
        </CardTitle>
        <CardDescription className="font-[family-name:var(--font-outfit)]">
          <time dateTime={evaluation.createdAt} suppressHydrationWarning>
            {new Date(evaluation.createdAt).toLocaleString()}
          </time>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {evaluation.summary}
        </p>

        {/* Score */}
        {evaluation.score != null ? (
          <div className="inline-flex flex-col gap-2 px-5 py-4 bg-create-accent/10 border border-create-accent/20 rounded-xl">
            <p className="text-xs font-[family-name:var(--font-outfit)] text-create-accent uppercase tracking-wider font-semibold">
              Score
            </p>
            <p className="text-3xl font-[family-name:var(--font-syne)] font-bold text-create-accent">
              {evaluation.score.value}{" "}
              <span className="text-xl font-normal text-create-accent/60">
                / {evaluation.score.max}
              </span>
            </p>
          </div>
        ) : null}

        {/* Metadata */}
        <dl className="space-y-4">
          {/* Evaluators */}
          <div className="flex items-start gap-3">
            <Users className="size-4 text-create-accent shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1 min-w-0">
              <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider">
                Evaluators
              </dt>
              <dd className="space-y-1">
                {evaluation.evaluators.map((evaluator, index) => {
                  const did =
                    typeof evaluator === "object" ? evaluator.did : evaluator;
                  return (
                    <div
                      key={index}
                      className="text-sm font-[family-name:var(--font-outfit)] break-all"
                    >
                      <URILink
                        uri={`https://bsky.app/profile/${did}`}
                        label={did}
                      />
                    </div>
                  );
                })}
              </dd>
            </div>
          </div>

          {/* Content */}
          {evaluation.content && evaluation.content.length > 0 ? (
            <div className="flex items-start gap-3 pt-4 border-t border-border/50">
              <FileText className="size-4 text-create-accent shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1 min-w-0">
                <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider">
                  Content
                </dt>
                <dd className="space-y-1">
                  {evaluation.content.map((uri, index) => (
                    <div
                      key={index}
                      className="text-sm font-[family-name:var(--font-outfit)] break-all"
                    >
                      <URILink
                        label={uri}
                        uri={uri.includes("https") ? uri : getPDSlsURI(uri)}
                      />
                    </div>
                  ))}
                </dd>
              </div>
            </div>
          ) : null}

          {/* Referenced Measurements */}
          {evaluation.measurements && evaluation.measurements.length > 0 ? (
            <div className="flex items-start gap-3 pt-4 border-t border-border/50">
              <FileText className="size-4 text-create-accent shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1 min-w-0">
                <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider">
                  Referenced Measurements
                </dt>
                <dd className="space-y-1">
                  {evaluation.measurements.map((uri, index) => (
                    <div
                      key={index}
                      className="text-sm font-[family-name:var(--font-outfit)] break-all"
                    >
                      <URILink
                        label={uri}
                        uri={uri.includes("https") ? uri : getPDSlsURI(uri)}
                      />
                    </div>
                  ))}
                </dd>
              </div>
            </div>
          ) : null}

          {/* Location */}
          {evaluation.location ? (
            <div className="flex items-start gap-3 pt-4 border-t border-border/50">
              <MapPin className="size-4 text-create-accent shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1 min-w-0">
                <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider">
                  Location
                </dt>
                <dd className="text-sm font-[family-name:var(--font-outfit)] break-all">
                  <URILink
                    label={evaluation.location}
                    uri={
                      evaluation.location.includes("https")
                        ? evaluation.location
                        : getPDSlsURI(evaluation.location)
                    }
                  />
                </dd>
              </div>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
