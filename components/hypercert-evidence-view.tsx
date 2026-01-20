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
import { Badge } from "./ui/badge";

export interface Evidence {
  title: string;
  shortDescription: string;
  description?: string;
  relationType: "supports" | "clarifies" | "challenges";
  content: {
    $type: string;
    uri?: string;
    blob?: string;
  };
  createdAt: string;
}

export default function HypercertEvidenceView({
  evidence,
}: {
  evidence?: Evidence;
}) {
  if (!evidence) {
    return null;
  }

  const evidenceUrl = evidence.content.uri || evidence.content.blob || "";

  const getRelationColor = (relation: Evidence["relationType"]) => {
    switch (relation) {
      case "supports":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "challenges":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "clarifies":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">{evidence.title}</CardTitle>
            <CardDescription>
              {new Date(evidence.createdAt).toLocaleString()}
            </CardDescription>
          </div>
          <Badge className={getRelationColor(evidence.relationType)}>
            {evidence.relationType.charAt(0).toUpperCase() +
              evidence.relationType.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">{evidence.shortDescription}</p>
          {evidence.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {evidence.description}
            </p>
          )}
        </div>

        <div className="pt-2">
          <dt className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
            Evidence Source
          </dt>
          <dd className="break-all text-sm font-medium">
            {evidenceUrl ? (
              <URILink
                label={evidenceUrl}
                uri={
                  evidenceUrl.startsWith("at://")
                    ? getPDSlsURI(evidenceUrl)
                    : evidenceUrl
                }
              />
            ) : (
              <span className="text-muted-foreground italic">
                No source link available
              </span>
            )}
          </dd>
        </div>
      </CardContent>
    </Card>
  );
}
