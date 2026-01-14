"use client";

import ActiveProfileInfoBox from "@/components/active-profile-info-box";
import EvaluationForm from "@/components/evaluation-form";
import HypercertContributionForm from "@/components/contributions-form";
import { StepperHeader } from "@/components/edit-cert-stepper";
import HypercertEvidenceForm from "@/components/evidence-form";
import HypercertCompletionStep from "@/components/hypercert-completion-step";
import HypercertsCreateForm from "@/components/hypercerts-create-form";
import HypercertLocationForm from "@/components/locations-form";
import { CreateHypercertResult } from "@hypercerts-org/sdk-core";
import { useState } from "react";
import MeasurementForm from "@/components/measurement-form";

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
