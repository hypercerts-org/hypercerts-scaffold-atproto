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
    <Card className="glass-panel border-border/50 overflow-hidden rounded-xl border">
      <CardHeader className="pb-4">
        <CardTitle className="font-[family-name:var(--font-syne)] text-lg">
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
        <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm leading-relaxed whitespace-pre-wrap">
          {evaluation.summary}
        </p>

        {/* Score */}
        {evaluation.score != null ? (
          <div className="bg-create-accent/10 border-create-accent/20 inline-flex flex-col gap-2 rounded-xl border px-5 py-4">
            <p className="text-create-accent font-[family-name:var(--font-outfit)] text-xs font-semibold tracking-wider uppercase">
              Score
            </p>
            <p className="text-create-accent font-[family-name:var(--font-syne)] text-3xl font-bold">
              {evaluation.score.value}{" "}
              <span className="text-create-accent/60 text-xl font-normal">
                / {evaluation.score.max}
              </span>
            </p>
          </div>
        ) : null}

        {/* Metadata */}
        <dl className="space-y-4">
          {/* Evaluators */}
          <div className="flex items-start gap-3">
            <Users className="text-create-accent mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <dt className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                Evaluators
              </dt>
              <dd className="space-y-1">
                {evaluation.evaluators.map((evaluator, index) => {
                  const did =
                    typeof evaluator === "object" ? evaluator.did : evaluator;
                  return (
                    <div
                      key={index}
                      className="font-[family-name:var(--font-outfit)] text-sm break-all"
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
            <div className="border-border/50 flex items-start gap-3 border-t pt-4">
              <FileText className="text-create-accent mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <dt className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                  Content
                </dt>
                <dd className="space-y-1">
                  {evaluation.content.map((uri, index) => (
                    <div
                      key={index}
                      className="font-[family-name:var(--font-outfit)] text-sm break-all"
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
            <div className="border-border/50 flex items-start gap-3 border-t pt-4">
              <FileText className="text-create-accent mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <dt className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                  Referenced Measurements
                </dt>
                <dd className="space-y-1">
                  {evaluation.measurements.map((uri, index) => (
                    <div
                      key={index}
                      className="font-[family-name:var(--font-outfit)] text-sm break-all"
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
            <div className="border-border/50 flex items-start gap-3 border-t pt-4">
              <MapPin className="text-create-accent mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <dt className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                  Location
                </dt>
                <dd className="font-[family-name:var(--font-outfit)] text-sm break-all">
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
