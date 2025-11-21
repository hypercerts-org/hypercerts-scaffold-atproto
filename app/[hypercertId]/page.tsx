"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ContributionsView from "@/components/hypercert-contribution-view";
import HypercertDetailsView from "@/components/hypercert-detail-view";
import { HypercertRecordData } from "@/lib/types";
import EvidenceView from "@/components/hypercert-evidence-view";
import RightsView from "@/components/hypercert-rights-view";
import LocationView from "@/components/hypercert-location-view";

export default function HypercertDetailsPage() {
  const params = useParams<{ hypercertId: string }>();
  const hypercertId = params.hypercertId;
  const router = useRouter();
  const { atProtoAgent, session } = useOAuthContext();

  const [certData, setCertData] = useState<HypercertRecordData>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!atProtoAgent || !session || !hypercertId) {
      router.push("/");
    }
  }, [atProtoAgent, session, hypercertId, router]);

  useEffect(() => {
    let cancelled = false;
    async function fetchHypercert() {
      if (!atProtoAgent || !hypercertId) return;
      setLoading(true);
      try {
        const response = await atProtoAgent.com.atproto.repo.getRecord({
          repo: atProtoAgent.assertDid,
          collection: "org.hypercerts.claim",
          rkey: hypercertId,
        });
        if (!cancelled) setCertData(response?.data as HypercertRecordData);
      } catch (error) {
        console.error("Error fetching hypercert:", error);
        toast.error("Failed to load hypercert");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchHypercert();
    return () => {
      cancelled = true;
    };
  }, [atProtoAgent, hypercertId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!certData?.value) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
        <p className="text-muted-foreground">No record found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Hypercert Details</CardTitle>
        </CardHeader>
        <CardContent>
          <HypercertDetailsView hypercertData={certData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <ContributionsView hypercertData={certData} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <EvidenceView hypercertData={certData} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Rights</CardTitle>
        </CardHeader>
        <CardContent>
          <RightsView hypercertData={certData} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Location</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationView hypercertData={certData} />
        </CardContent>
      </Card>
    </div>
  );
}
