"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getRecordWithURI } from "@/lib/queries";
import {
  Collections,
  type HypercertRecordData,
  type HypercertRightsData,
} from "@/lib/types";
import { getPDSlsURI } from "@/lib/utils";
import { Field, LabelSmall } from "./hypercert-field";
import Loader from "./loader";
import { URILink } from "./uri-link";

export default function RightsView({
  hypercertData,
}: {
  hypercertData?: HypercertRecordData;
}) {
  const { atProtoAgent } = useOAuthContext();
  const hypercertRecord = hypercertData?.value;

  const [loading, setLoading] = useState(false);
  const [rights, setRights] = useState<HypercertRightsData | null>(null);

  useEffect(() => {
    async function fetchRights() {
      if (!atProtoAgent) return;
      const rightsRef = hypercertRecord?.rights;
      if (!rightsRef?.uri) return;
      setLoading(true);
      try {
        const data = await getRecordWithURI<HypercertRightsData>(
          rightsRef.uri,
          atProtoAgent,
          Collections.rights
        );
        setRights(data);
      } catch (e) {
        console.error("Error loading rights", e);
        toast.error("Failed to load rights");
      } finally {
        setLoading(false);
      }
    }

    fetchRights();
  }, [atProtoAgent, hypercertRecord?.rights]);

  if (!hypercertRecord?.rights) {
    return <p className="text-sm text-muted-foreground">No rights linked.</p>;
  }

  if (loading) {
    return <Loader />;
  }

  if (!rights) {
    return (
      <p className="text-sm text-muted-foreground">
        Rights reference present, but details could not be loaded.
      </p>
    );
  }

  const rightsRecord = rights.value;

  return (
    <div className="space-y-4">
      <Card className="border">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Rights Name" value={rightsRecord.rightsName || "—"} />
            <Field
              label="Rights Identifier"
              value={rightsRecord.rightsType || "—"}
            />

            <Field
              label="Created At"
              value={
                rightsRecord.createdAt
                  ? new Date(rightsRecord.createdAt).toLocaleString()
                  : "—"
              }
            />

            <div className="md:col-span-2">
              <LabelSmall>Rights Description</LabelSmall>
              <p className="text-sm whitespace-pre-wrap">
                {rightsRecord.rightsDescription || "—"}
              </p>
            </div>

            <Separator className="md:col-span-2" />

            <Field
              label="URI"
              value={
                <URILink
                  uri={getPDSlsURI(rights.uri) || "—"}
                  label={rights.uri}
                />
              }
              mono
            />
            <Field label="CID" value={rights.cid || "—"} mono />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
