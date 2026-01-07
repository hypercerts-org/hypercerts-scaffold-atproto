"use client";

import HypercertContributionForm from "@/components/contributions-form";
import { StepperHeader } from "@/components/edit-cert-stepper";
import HypercertEvidenceForm from "@/components/evidence-form";
import HypercertCompletionStep from "@/components/hypercert-completion-step";
import HypercertsCreateForm from "@/components/hypercerts-create-form";
import HypercertLocationForm from "@/components/locations-form";
import HypercertRightsForm from "@/components/rights-form";
import { useState } from "react";

export default function Home() {
  const [step, setStep] = useState<number>(1);
  const [hypercertId, setHypercertId] = useState<string>();
  const [hypercertUri, setHypercertUri] = useState<string>();

  const nextStepper = () => {
    setStep((step) => step + 1);
  };
  const previousStepper = () => {
    setStep((step) => step - 1);
  };
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <StepperHeader step={step} />
      {step === 1 && (
        <HypercertsCreateForm
          hypercertUri={hypercertUri}
          setHypercertUri={setHypercertUri}
          setHypercertId={setHypercertId}
          nextStepper={nextStepper}
        />
      )}
      {step === 2 && hypercertId && (
        <HypercertContributionForm
          hypercertUri={hypercertUri}
          onNext={() => setStep((step) => step + 1)}
          onBack={previousStepper}
        />
      )}
      {step === 3 && hypercertId && (
        <HypercertEvidenceForm
          hypercertId={hypercertId}
          onNext={nextStepper}
          onBack={previousStepper}
        />
      )}
      {step === 4 && hypercertId && (
        <HypercertLocationForm
          onNext={nextStepper}
          onBack={previousStepper}
          hypercertId={hypercertId}
        />
      )}
      {step === 5 && hypercertId && (
        <HypercertRightsForm
          onNext={nextStepper}
          onBack={previousStepper}
          hypercertId={hypercertId}
        />
      )}
      {step === 6 && (
        <HypercertCompletionStep
          onCreateAnother={() => setStep(1)}
          onBack={previousStepper}
          hypercertId={hypercertId}
        />
      )}
    </div>
  );
}
