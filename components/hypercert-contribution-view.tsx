"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getRecordWithURI } from "@/lib/queries";
import {
  Collections,
  type HypercertContributionData,
  type HypercertRecordData,
} from "@/lib/types";
import { getPDSlsURI } from "@/lib/utils";
import { Field, LabelSmall } from "./hypercert-field";
import Loader from "./loader";
import { URILink } from "./uri-link";

export default function ContributionsView({
  hypercertData,
}: {
  hypercertData?: HypercertRecordData;
}) {
  const { atProtoAgent } = useOAuthContext();
  const hypercertRecord = hypercertData?.value;

  const [loading, setLoading] = useState(false);
  const [contributions, setContributions] = useState<
    HypercertContributionData[]
  >([]);

  useEffect(() => {
    async function fetchAll() {
      if (!atProtoAgent) return;
      const hypercertContributions = hypercertRecord?.contributions || [];
      if (!hypercertContributions.length) return;

      setLoading(true);
      try {
        const results = await Promise.all(
          hypercertContributions.map(async (contribution) => {
            const data = await getRecordWithURI<HypercertContributionData>(
              contribution.uri,
              atProtoAgent,
              Collections.contribution
            );
            return data;
          })
        );
        setContributions(
          results.filter(Boolean) as HypercertContributionData[]
        );
      } catch (e) {
        console.error("Error loading contributions", e);
        toast.error("Failed to load contributions");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [atProtoAgent, hypercertRecord?.contributions]);

  if (!hypercertRecord?.contributions?.length) {
    return (
      <p className="text-sm text-muted-foreground">No contributions linked.</p>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-4">
      {contributions.map((contribution, idx) => {
        const contributionRecord = contribution.value;
        return (
          <Card key={idx} className="border">
            <CardContent className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Role / Title"
                  value={contributionRecord.role || "—"}
                />
                <Field
                  label="Contributors (DIDs)"
                  value={
                    Array.isArray(contributionRecord.contributors) &&
                    contributionRecord.contributors.length
                      ? contributionRecord.contributors.join(", ")
                      : "—"
                  }
                />
                <Field
                  label="Work Started"
                  value={
                    contributionRecord.workTimeframeFrom
                      ? new Date(
                          contributionRecord.workTimeframeFrom
                        ).toLocaleDateString()
                      : "—"
                  }
                />
                <Field
                  label="Work Finished"
                  value={
                    contributionRecord.workTimeframeTo
                      ? new Date(
                          contributionRecord.workTimeframeTo
                        ).toLocaleDateString()
                      : "—"
                  }
                />
                <div className="md:col-span-2">
                  <LabelSmall>Summary</LabelSmall>
                  <p className="text-sm whitespace-pre-wrap">
                    {contributionRecord.description || "—"}
                  </p>
                </div>

                <Separator className="md:col-span-2" />

                <Field
                  label="URI"
                  value={
                    <URILink
                      uri={getPDSlsURI(contribution.uri) || "—"}
                      label={contribution.uri}
                    />
                  }
                  mono
                />
                <Field label="CID" value={contribution.cid || "—"} mono />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
