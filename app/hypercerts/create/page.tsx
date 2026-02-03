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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <ActiveProfileInfoBox />
      <StepperHeader step={step} />
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
  );
}
