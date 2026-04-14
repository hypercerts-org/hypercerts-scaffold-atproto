"use client";

import { StepperHeader } from "@/components/edit-cert-stepper";
import type { CreateHypercertResult } from "@/lib/types";
import dynamic from "next/dynamic";
import { useState } from "react";
import {
  HypercertsCreateFormSkeleton,
  EvidenceFormSkeleton,
  LocationFormSkeleton,
  MeasurementFormSkeleton,
  EvaluationFormSkeleton,
  CompletionStepSkeleton,
} from "@/components/form-skeletons";

// Dynamically import heavy step components with pixel-perfect skeleton loaders
// This prevents the page from going blank while loading and keeps the sidebar visible
const HypercertsCreateForm = dynamic(
  () => import("@/components/hypercerts-create-form"),
  { loading: () => <HypercertsCreateFormSkeleton /> },
);
const HypercertEvidenceForm = dynamic(
  () => import("@/components/evidence-form"),
  { loading: () => <EvidenceFormSkeleton /> },
);
const HypercertLocationForm = dynamic(
  () => import("@/components/locations-form"),
  { loading: () => <LocationFormSkeleton /> },
);
const MeasurementForm = dynamic(() => import("@/components/measurement-form"), {
  loading: () => <MeasurementFormSkeleton />,
});
const EvaluationForm = dynamic(() => import("@/components/evaluation-form"), {
  loading: () => <EvaluationFormSkeleton />,
});
const HypercertCompletionStep = dynamic(
  () => import("@/components/hypercert-completion-step"),
  { loading: () => <CompletionStepSkeleton /> },
);

export default function Home() {
  const [step, setStep] = useState<number>(1);
  const [hypercertInfo, setHypercertInfo] = useState<CreateHypercertResult>();

  const nextStepper = () => {
    setStep((step) => step + 1);
  };
  const previousStepper = () => {
    setStep((step) => step - 1);
  };

  return (
    <div className="noise-bg relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 lg:py-12">
        {/* Page header */}
        <div className="animate-fade-in mb-8 lg:mb-10">
          <h1 className="text-foreground font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight lg:text-4xl">
            Create Hypercert
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl font-[family-name:var(--font-outfit)] text-sm">
            Define your impact claim with verifiable details, evidence, and
            measurements.
          </p>
        </div>

        {/* Two-column layout: sidebar + main */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr] lg:gap-12">
          {/* Sidebar - persistent and always visible */}
          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <StepperHeader step={step} />
          </aside>

          {/* Main content area - only forms change with skeletons during loading */}
          <main className="min-w-0">
            {step === 1 ? (
              <HypercertsCreateForm
                setHypercertInfo={setHypercertInfo}
                hypercertInfo={hypercertInfo}
                nextStepper={nextStepper}
              />
            ) : null}
            {step === 2 && hypercertInfo ? (
              <HypercertEvidenceForm
                hypercertInfo={hypercertInfo}
                onNext={nextStepper}
                onBack={previousStepper}
              />
            ) : null}
            {step === 3 && hypercertInfo ? (
              <HypercertLocationForm
                onNext={nextStepper}
                onBack={previousStepper}
                hypercertInfo={hypercertInfo}
              />
            ) : null}
            {step === 4 && hypercertInfo ? (
              <MeasurementForm
                hypercertInfo={hypercertInfo}
                onNext={nextStepper}
                onBack={previousStepper}
              />
            ) : null}
            {step === 5 && hypercertInfo ? (
              <EvaluationForm
                hypercertInfo={hypercertInfo}
                onNext={nextStepper}
                onBack={previousStepper}
              />
            ) : null}
            {step === 6 ? (
              <HypercertCompletionStep
                onCreateAnother={() => setStep(1)}
                onBack={previousStepper}
                hypercertInfo={hypercertInfo}
              />
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
