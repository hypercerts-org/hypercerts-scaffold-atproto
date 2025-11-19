"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import { SmallBlob, Uri } from "@/lexicons/types/app/certified/defs";
import { getRecordWithURI } from "@/lib/queries";
import {
  type HypercertEvidenceData,
  type HypercertRecordData,
  Collections,
} from "@/lib/types";
import { getBlobURL, getPDSlsURI } from "@/lib/utils";
import { $Typed } from "@atproto/api";
import { Field, LabelSmall } from "./hypercert-field";
import Loader from "./loader";
import { URILink } from "./uri-link";

export default function EvidenceView({
  hypercertData,
}: {
  hypercertData?: HypercertRecordData;
}) {
  const { atProtoAgent } = useOAuthContext();
  const hypercertRecord = hypercertData?.value;

  const [loading, setLoading] = useState(false);
  const [evidenceList, setEvidenceList] = useState<HypercertEvidenceData[]>([]);

  useEffect(() => {
    async function fetchAll() {
      if (!atProtoAgent) return;
      const hypercertEvidence = hypercertRecord?.evidence || [];
      if (!hypercertEvidence.length) return;

      setLoading(true);
      try {
        const results = await Promise.all(
          hypercertEvidence.map(async (evidenceRef) => {
            const data = await getRecordWithURI<HypercertEvidenceData>(
              evidenceRef.uri,
              atProtoAgent,
              Collections.evidence
            );
            return data;
          })
        );

        setEvidenceList(results.filter(Boolean) as HypercertEvidenceData[]);
      } catch (e) {
        console.error("Error loading evidence", e);
        toast.error("Failed to load evidence");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [atProtoAgent, hypercertRecord?.evidence]);

  if (!hypercertRecord?.evidence?.length) {
    return <p className="text-sm text-muted-foreground">No evidence linked.</p>;
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-4">
      {evidenceList.map((evidence, idx) => {
        const record = evidence.value;

        const content = record.content;
        const contentType = content?.$type as string | undefined;

        let contentDisplay: ReactNode = "—";

        // Handle URI content
        if (
          content?.$type === "app.certified.defs#uri" &&
          (content as $Typed<Uri>)?.value
        ) {
          const contentValue = (content as $Typed<Uri>).value;
          contentDisplay = (
            <URILink uri={getPDSlsURI(contentValue)} label={contentValue} />
          );
        }
        // Handle smallBlob content
        else if (contentType === "smallBlob") {
          const contentValue = content as $Typed<SmallBlob>;
          contentDisplay = (
            <p className="text-sm">
              Blob evidence
              {contentValue?.ref && (
                <>
                  {" · "}
                  <URILink
                    uri={getBlobURL(contentValue, atProtoAgent?.assertDid)}
                    label={contentValue.ref.toString()}
                  />
                </>
              )}
            </p>
          );
        }
        // Fallback: show raw type
        else if (contentType) {
          contentDisplay = (
            <span className="text-xs font-mono break-all">{contentType}</span>
          );
        }

        return (
          <Card key={idx} className="border">
            <CardContent className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Title" value={record.title || "—"} />
                <Field
                  label="Created At"
                  value={
                    record.createdAt
                      ? new Date(record.createdAt).toLocaleString()
                      : "—"
                  }
                />

                <div className="md:col-span-2">
                  <LabelSmall>Short Description</LabelSmall>
                  <p className="text-sm whitespace-pre-wrap">
                    {record.shortDescription || "—"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <LabelSmall>Detailed Description</LabelSmall>
                  <p className="text-sm whitespace-pre-wrap">
                    {record.description || "—"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <LabelSmall>Evidence Content</LabelSmall>
                  <div className="text-sm">{contentDisplay}</div>
                </div>

                <Separator className="md:col-span-2" />

                <Field
                  label="URI"
                  value={
                    <URILink
                      uri={getPDSlsURI(evidence.uri) || "—"}
                      label={evidence.uri}
                    />
                  }
                  mono
                />
                <Field label="CID" value={evidence.cid || "—"} mono />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
