"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import type { HypercertRecordData, HypercertRightsData } from "@/lib/types";
import { parseAtUri } from "@/lib/utils";
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
        const parsedURI = parseAtUri(rightsRef.uri);
        if (!parsedURI) {
          setLoading(false);
          return;
        }

        const response = await atProtoAgent.com.atproto.repo.getRecord({
          repo: parsedURI.did,
          collection: parsedURI.collection || "org.hypercerts.claim.rights",
          rkey: parsedURI.rkey,
        });

        const data = response?.data;
        if (!data) {
          setRights(null);
        } else {
          setRights(data as HypercertRightsData);
        }
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
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
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
              value={<URILink uri={rights.uri || "—"} />}
              mono
            />
            <Field label="CID" value={rights.cid || "—"} mono />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LabelSmall({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground mb-1">{children}</div>;
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <LabelSmall>{label}</LabelSmall>
      <p className={`text-sm ${mono ? "font-mono break-all" : ""}`}>{value}</p>
    </div>
  );
}
