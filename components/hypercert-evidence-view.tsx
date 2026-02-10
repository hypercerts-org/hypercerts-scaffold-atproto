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
import { Link as LinkIcon } from "lucide-react";

export interface Evidence {
  title: string;
  shortDescription: string;
  description?: string;
  contentType?: "evidence" | "report" | "audit" | "testimonial" | "methodology";
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

  const getContentTypeColor = (type?: Evidence["contentType"]) => {
    // All content types use the same color
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
  };

  return (
    <Card className="glass-panel rounded-xl border border-border/50 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg font-[family-name:var(--font-syne)]">
              {evidence.title}
            </CardTitle>
            <CardDescription className="font-[family-name:var(--font-outfit)]">
              <time dateTime={evidence.createdAt} suppressHydrationWarning>
                {new Date(evidence.createdAt).toLocaleString()}
              </time>
            </CardDescription>
          </div>
          <Badge className={`${getContentTypeColor(evidence.contentType)} font-[family-name:var(--font-outfit)] shrink-0`}>
            {evidence.contentType
              ? evidence.contentType.charAt(0).toUpperCase() +
                evidence.contentType.slice(1)
              : "Evidence"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-[family-name:var(--font-outfit)] font-medium">
            {evidence.shortDescription}
          </p>
          {evidence.description && (
            <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {evidence.description}
            </p>
          )}
        </div>

        <div className="flex items-start gap-3 pt-2 border-t border-border/50">
          <LinkIcon className="size-4 text-create-accent shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1 min-w-0">
            <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider">
              Evidence Source
            </dt>
            <dd className="text-sm font-[family-name:var(--font-outfit)] break-all">
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
        </div>
      </CardContent>
    </Card>
  );
}
