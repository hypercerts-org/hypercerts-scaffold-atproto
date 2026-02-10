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
import { OrgHypercertsClaimAttachment, OrgHypercertsDefs } from "@hypercerts-org/sdk-core";

type Attachment = OrgHypercertsClaimAttachment.Main;

export default function HypercertEvidenceView({
  evidence,
}: {
  evidence?: Attachment;
}) {
  if (!evidence) {
    return null;
  }

  const getContentTypeColor = (type?: string) => {
    // All content types use the same color
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
  };

  // Helper to extract URL from content item
  const getContentUrl = (contentItem: Attachment["content"][number]): string => {
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

        {evidence.content && evidence.content.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            {evidence.content.map((contentItem, index) => {
              const contentUrl = getContentUrl(contentItem);
              return (
                <div key={index} className="flex items-start gap-3">
                  <LinkIcon className="size-4 text-create-accent shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider">
                      {evidence.content.length > 1 
                        ? `Evidence Source ${index + 1}`
                        : "Evidence Source"
                      }
                    </dt>
                    <dd className="text-sm font-[family-name:var(--font-outfit)] break-all">
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
        )}
      </CardContent>
    </Card>
  );
}
