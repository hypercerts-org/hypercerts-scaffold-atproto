"use client";

import ActiveProfileInfoBox from "@/components/active-profile-info-box";
import { StepperHeader } from "@/components/edit-cert-stepper";
import type { CreateHypercertResult } from "@hypercerts-org/sdk-core";
import dynamic from "next/dynamic";
import { useState } from "react";
import {
  HypercertsCreateFormSkeleton,
  ContributionFormSkeleton,
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
  { loading: () => <HypercertsCreateFormSkeleton /> }
);
// const HypercertContributionForm = dynamic(
//   () => import("@/components/contributions-form"),
//   { loading: () => <ContributionFormSkeleton /> }
// );
const HypercertEvidenceForm = dynamic(
  () => import("@/components/evidence-form"),
  { loading: () => <EvidenceFormSkeleton /> }
);
const HypercertLocationForm = dynamic(
  () => import("@/components/locations-form"),
  { loading: () => <LocationFormSkeleton /> }
);
const MeasurementForm = dynamic(
  () => import("@/components/measurement-form"),
  { loading: () => <MeasurementFormSkeleton /> }
);
const EvaluationForm = dynamic(
  () => import("@/components/evaluation-form"),
  { loading: () => <EvaluationFormSkeleton /> }
);
const HypercertCompletionStep = dynamic(
  () => import("@/components/hypercert-completion-step"),
  { loading: () => <CompletionStepSkeleton /> }
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
    <div className="relative min-h-screen noise-bg">
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Page header */}
        <div className="mb-8 lg:mb-10 animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-[family-name:var(--font-syne)] font-bold tracking-tight text-foreground">
            Create Hypercert
          </h1>
          <p className="mt-2 text-sm font-[family-name:var(--font-outfit)] text-muted-foreground max-w-xl">
            Define your impact claim with verifiable details, evidence, and measurements.
          </p>
        </div>

        {/* Two-column layout: sidebar + main */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
          {/* Sidebar - persistent and always visible */}
          <aside className="lg:sticky lg:top-8 lg:self-start space-y-6">
            <ActiveProfileInfoBox />
            <StepperHeader step={step} />
          </aside>

          {/* Main content area - only forms change with skeletons during loading */}
          <main className="min-w-0">
            {step === 1 && (
              <HypercertsCreateForm
                setHypercertInfo={setHypercertInfo}
                hypercertInfo={hypercertInfo}
                nextStepper={nextStepper}
              />
            )}
            {/* TODO commented out for now while SDK addContribution stabilized */}
            {/* {step === 2 && hypercertInfo && (
              <HypercertContributionForm
                hypercertInfo={hypercertInfo}
                onNext={() => setStep((step) => step + 1)}
                onBack={previousStepper}
              />
            )} */}
            {step === 2 && hypercertInfo && (
              <HypercertEvidenceForm
                hypercertInfo={hypercertInfo}
                onNext={nextStepper}
                onBack={previousStepper}
              />
            )}
            {step === 3 && hypercertInfo && (
              <HypercertLocationForm
                onNext={nextStepper}
                onBack={previousStepper}
                hypercertInfo={hypercertInfo}
              />
            )}
            {step === 4 && hypercertInfo && (
              <MeasurementForm
                hypercertInfo={hypercertInfo}
                onNext={nextStepper}
                onBack={previousStepper}
              />
            )}
            {step === 5 && hypercertInfo && (
              <EvaluationForm
                hypercertInfo={hypercertInfo}
                onNext={nextStepper}
                onBack={previousStepper}
              />
            )}
            {step === 6 && (
              <HypercertCompletionStep
                onCreateAnother={() => setStep(1)}
                onBack={previousStepper}
                hypercertInfo={hypercertInfo}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
