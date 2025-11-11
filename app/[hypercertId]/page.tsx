"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import type * as HypercertRecord from "@/lexicons/types/org/hypercerts/claim";

import HypercertDetailsForm from "@/components/hypercerts-detail-form";
import HypercertContributionForm from "@/components/contributions-form";
import { ComAtprotoRepoGetRecord } from "@atproto/api";
import { StepperHeader } from "@/components/edit-cert-stepper";

export type CertData = Omit<ComAtprotoRepoGetRecord.OutputSchema, "value"> & {
  value: HypercertRecord.Record;
};
export default function EditHypercertIdPage() {
  const params = useParams<{ hypercertId: string }>();
  const hypercertId = params.hypercertId;
  const router = useRouter();
  const { atProtoAgent, session } = useOAuthContext();
  const [certData, setCertData] = useState<CertData>();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);

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
        setCertData(response?.data as CertData);
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <StepperHeader step={step} />

      {step === 1 && (
        <HypercertDetailsForm
          hypercertId={hypercertId}
          initialRecord={certData?.value}
          onSaved={({ advance }) => {
            if (advance) {
              setStep(2);
            } else {
              toast.success("Saved!");
            }
          }}
        />
      )}

      {step === 2 && (
        <div className="mt-6">
          <HypercertContributionForm
            hypercertId={hypercertId}
            hypercertData={certData}
            onBack={() => setStep(1)}
          />
        </div>
      )}
    </div>
  );
}
