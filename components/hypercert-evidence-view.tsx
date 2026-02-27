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
import { OrgHypercertsClaimAttachment } from "@hypercerts-org/sdk-core";

type Attachment = OrgHypercertsClaimAttachment.Main;

export default function HypercertEvidenceView({
  evidence,
}: {
  evidence?: Attachment;
}) {
  if (!evidence) {
    return null;
  }

  const getContentTypeColor = () => {
    // All content types use the same color
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
  };

  // Helper to extract URL from content item
  const getContentUrl = (
    contentItem: Attachment["content"][number],
  ): string => {
    // Check if it's a Uri type
    if ("uri" in contentItem && contentItem.uri) {
      return contentItem.uri;
    }
    // Check if it's a SmallBlob type (BlobRef will be stringified)
    if ("blob" in contentItem && contentItem.blob) {
      return String(contentItem.blob);
    }
    return "";
  };

  return (
    <Card className="glass-panel border-border/50 overflow-hidden rounded-xl border">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="font-[family-name:var(--font-syne)] text-lg">
              {evidence.title}
            </CardTitle>
            <CardDescription className="font-[family-name:var(--font-outfit)]">
              <time dateTime={evidence.createdAt} suppressHydrationWarning>
                {new Date(evidence.createdAt).toLocaleString()}
              </time>
            </CardDescription>
          </div>
          <Badge
            className={`${getContentTypeColor()} shrink-0 font-[family-name:var(--font-outfit)]`}
          >
            {evidence.contentType
              ? evidence.contentType.charAt(0).toUpperCase() +
                evidence.contentType.slice(1)
              : "Evidence"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="font-[family-name:var(--font-outfit)] text-sm font-medium">
            {evidence.shortDescription}
          </p>
          {evidence.description ? (
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm leading-relaxed whitespace-pre-wrap">
              {evidence.description}
            </p>
          ) : null}
        </div>

        {evidence.content && evidence.content.length > 0 ? (
          <div className="border-border/50 space-y-3 border-t pt-2">
            {evidence.content.map((contentItem, index) => {
              const contentUrl = getContentUrl(contentItem);
              return (
                <div key={index} className="flex items-start gap-3">
                  <LinkIcon className="text-create-accent mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <dt className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                      {evidence.content.length > 1
                        ? `Evidence Source ${index + 1}`
                        : "Evidence Source"}
                    </dt>
                    <dd className="font-[family-name:var(--font-outfit)] text-sm break-all">
                      {contentUrl ? (
                        <URILink
                          label={contentUrl}
                          uri={
                            contentUrl.startsWith("at://")
                              ? getPDSlsURI(contentUrl)
                              : contentUrl
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
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
