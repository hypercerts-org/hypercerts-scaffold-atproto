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

function StepperHeader({ step }: { step: 1 | 2 }) {
  const steps = [
    { id: 1, label: "Hypercert Details" },
    { id: 2, label: "Contributions" },
  ];
  return (
    <div className="flex items-center justify-center gap-6 my-6">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full grid place-items-center text-sm font-medium ${
              step === s.id ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {s.id}
          </div>
          <span
            className={`text-sm ${
              step === s.id ? "font-semibold" : "text-muted-foreground"
            }`}
          >
            {s.label}
          </span>
          {idx < steps.length - 1 && (
            <div className="w-10 h-1.5 bg-border mx-2" />
          )}
        </div>
      ))}
    </div>
  );
}

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

  // Redirect if auth missing
  useEffect(() => {
    if (!atProtoAgent || !session || !hypercertId) {
      router.push("/");
    }
  }, [atProtoAgent, session, hypercertId, router]);

  // Fetch original record
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
            // When the child successfully saves, decide whether to advance
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
          {/* optional: a compact summary of the main record above the form */}
          <HypercertContributionForm
            hypercertId={hypercertId}
            hypercertData={certData}
          />
        </div>
      )}
    </div>
  );
}
