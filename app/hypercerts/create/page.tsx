"use client";

import ActiveProfileInfoBox from "@/components/active-profile-info-box";
import { StepperHeader } from "@/components/edit-cert-stepper";
import HypercertsCreateForm from "@/components/hypercerts-create-form";
import type { CreateHypercertResult } from "@hypercerts-org/sdk-core";
import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically import heavy step components (only loaded when their step is active)
const HypercertContributionForm = dynamic(
  () => import("@/components/contributions-form")
);
const HypercertEvidenceForm = dynamic(
  () => import("@/components/evidence-form")
);
const HypercertLocationForm = dynamic(
  () => import("@/components/locations-form")
);
const MeasurementForm = dynamic(() => import("@/components/measurement-form"));
const EvaluationForm = dynamic(() => import("@/components/evaluation-form"));
const HypercertCompletionStep = dynamic(
  () => import("@/components/hypercert-completion-step")
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
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-8 lg:self-start space-y-6">
            <ActiveProfileInfoBox />
            <StepperHeader step={step} />
          </aside>

          {/* Main content area */}
          <main className="min-w-0">
            <div
              key={step}
              className="animate-fade-in-up"
            >
              {step === 1 && (
                <HypercertsCreateForm
                  setHypercertInfo={setHypercertInfo}
                  hypercertInfo={hypercertInfo}
                  nextStepper={nextStepper}
                />
              )}
              {step === 2 && hypercertInfo && (
                <HypercertContributionForm
                  hypercertInfo={hypercertInfo}
                  onNext={() => setStep((step) => step + 1)}
                  onBack={previousStepper}
                />
              )}
              {step === 3 && hypercertInfo && (
                <HypercertEvidenceForm
                  hypercertInfo={hypercertInfo}
                  onNext={nextStepper}
                  onBack={previousStepper}
                />
              )}
              {step === 4 && hypercertInfo && (
                <HypercertLocationForm
                  onNext={nextStepper}
                  onBack={previousStepper}
                  hypercertInfo={hypercertInfo}
                />
              )}
              {step === 5 && hypercertInfo && (
                <MeasurementForm
                  hypercertInfo={hypercertInfo}
                  onNext={nextStepper}
                  onBack={previousStepper}
                />
              )}
              {step === 6 && hypercertInfo && (
                <EvaluationForm
                  hypercertInfo={hypercertInfo}
                  onNext={nextStepper}
                  onBack={previousStepper}
                />
              )}
              {step === 7 && (
                <HypercertCompletionStep
                  onCreateAnother={() => setStep(1)}
                  onBack={previousStepper}
                  hypercertInfo={hypercertInfo}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
