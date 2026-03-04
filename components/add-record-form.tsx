"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CreateHypercertResult } from "@/lib/types";
import {
  MeasurementFormSkeleton,
  EvaluationFormSkeleton,
  EvidenceFormSkeleton,
} from "@/components/form-skeletons";

const MeasurementForm = dynamic(() => import("@/components/measurement-form"), {
  loading: () => <MeasurementFormSkeleton />,
});
const EvaluationForm = dynamic(() => import("@/components/evaluation-form"), {
  loading: () => <EvaluationFormSkeleton />,
});
const HypercertEvidenceForm = dynamic(
  () => import("@/components/evidence-form"),
  {
    loading: () => <EvidenceFormSkeleton />,
  },
);
// ContributionsForm is currently disabled, so use a simple placeholder for now

const TYPE_LABELS: Record<string, string> = {
  measurement: "Measurement",
  evaluation: "Evaluation",
  evidence: "Evidence",
  contribution: "Contribution",
};

interface AddRecordFormProps {
  hypercertUri: string;
  type: string;
}

export default function AddRecordForm({
  hypercertUri,
  type,
}: AddRecordFormProps) {
  const router = useRouter();

  const hypercertDetailHref = `/hypercerts/${encodeURIComponent(hypercertUri)}`;

  const goBack = () => {
    router.push(hypercertDetailHref);
  };

  const hypercertInfo: CreateHypercertResult = useMemo(
    () => ({ hypercertUri, hypercertCid: "", rightsUri: "", rightsCid: "" }),
    [hypercertUri],
  );

  const typeLabel = TYPE_LABELS[type];
  const title = typeLabel
    ? `Add ${typeLabel} to Hypercert`
    : "Unknown record type";

  function renderForm() {
    switch (type) {
      case "measurement":
        return (
          <MeasurementForm
            hypercertInfo={hypercertInfo}
            onNext={goBack}
            onBack={goBack}
          />
        );
      case "evaluation":
        return (
          <EvaluationForm
            hypercertInfo={hypercertInfo}
            onNext={goBack}
            onBack={goBack}
          />
        );
      case "evidence":
        return (
          <HypercertEvidenceForm
            hypercertInfo={hypercertInfo}
            onNext={goBack}
            onBack={goBack}
          />
        );
      case "contribution":
        return (
          <div className="glass-panel text-muted-foreground rounded-2xl p-8 text-center font-[family-name:var(--font-outfit)]">
            Contribution form coming soon
          </div>
        );
      default:
        return (
          <div className="glass-panel text-muted-foreground rounded-2xl p-8 text-center font-[family-name:var(--font-outfit)]">
            Unknown record type
          </div>
        );
    }
  }

  return (
    <main className="noise-bg relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-4xl space-y-6 px-4 py-8">
        {/* Back button */}
        <div className="animate-fade-in-up">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-create-accent font-[family-name:var(--font-outfit)] transition-colors"
          >
            <Link href={hypercertDetailHref}>
              <ArrowLeft className="mr-2 size-4" />
              Back to Hypercert
            </Link>
          </Button>
        </div>

        {/* Title */}
        <div className="animate-fade-in-up">
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
            {title}
          </h1>
        </div>

        {/* Form */}
        <div className="animate-fade-in-up">{renderForm()}</div>
      </div>
    </main>
  );
}
