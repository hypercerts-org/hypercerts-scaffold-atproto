"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getRecordWithURI } from "@/lib/queries";
import {
  type HypercertEvidenceData,
  type HypercertRecordData,
  Collections,
} from "@/lib/types";
import { getPDSlsURI } from "@/lib/utils";
import { BlobDisplay } from "./blob-display";
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
                  <BlobDisplay
                    content={record.content}
                    did={atProtoAgent?.assertDid}
                  />
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
