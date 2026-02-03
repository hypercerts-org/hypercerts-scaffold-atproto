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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evaluation</CardTitle>
        <CardDescription>
          <time dateTime={evaluation.createdAt} suppressHydrationWarning>
            {new Date(evaluation.createdAt).toLocaleString()}
          </time>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm whitespace-pre-wrap">{evaluation.summary}</p>

        {evaluation.score != null && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-2xl font-bold">
              {evaluation.score.value}{" "}
              <span className="text-base font-normal text-muted-foreground">
                / {evaluation.score.max}
              </span>
            </p>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-y-2 text-sm">
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">Evaluators</dt>
            <dd>
              <ul className="list-disc list-inside">
                {evaluation.evaluators.map((evaluator, index) => {
                  const did = typeof evaluator === "object" ? evaluator.did : evaluator;
                  return (
                    <li key={index} className="break-all">
                      <URILink
                        uri={`https://bsky.app/profile/${did}`}
                        label={did}
                      />
                    </li>
                  );
                })}
              </ul>
            </dd>
          </div>

          {evaluation.content && evaluation.content.length > 0 && (
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">Content</dt>
              <dd>
                <ul className="list-disc list-inside">
                  {evaluation.content.map((uri, index) => (
                    <li key={index} className="break-all">
                      <URILink
                        label={uri}
                        uri={uri.includes("https") ? uri : getPDSlsURI(uri)}
                      />
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}

          {evaluation.measurements && evaluation.measurements.length > 0 && (
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">
                Referenced Measurements
              </dt>
              <dd>
                <ul className="list-disc list-inside">
                  {evaluation.measurements.map((uri, index) => (
                    <li key={index} className="break-all">
                      <URILink
                        label={uri}
                        uri={uri.includes("https") ? uri : getPDSlsURI(uri)}
                      />
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}

          {evaluation.location && (
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">Location</dt>
              <dd className="break-all">
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
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
