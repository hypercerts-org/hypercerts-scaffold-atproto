"use client";

import HypercertContributionForm from "@/components/contributions-form";
import { StepperHeader } from "@/components/edit-cert-stepper";
import HypercertEvidenceForm from "@/components/evidence-form";
import HypercertCompletionStep from "@/components/hypercert-completion-step";
import HypercertsCreateForm from "@/components/hypercerts-create-form";
import HypercertLocationForm from "@/components/locations-form";
import HypercertRightsForm from "@/components/rights-form";
import { CreateHypercertResult } from "@hypercerts-org/sdk-core";
import { useState } from "react";

export default function Home() {
  const [step, setStep] = useState<number>(1);
  const [hypercertId, setHypercertId] = useState<string>();
  const [hypercertUri, setHypercertUri] = useState<string>(
    "at://did:plc:u7h3dstby64di67bxaotzxcz/org.hypercerts.claim.activity/3mbtojy336h2h"
  );
  const [hypercertInfo, setHypercertInfo] = useState<CreateHypercertResult>();
  const [hypercertCid, setHypercertCid] = useState<string>();

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
          setHypercertInfo={setHypercertInfo}
          hypercertUri={hypercertUri}
          setHypercertUri={setHypercertUri}
          setHypercertId={setHypercertId}
          nextStepper={nextStepper}
        />
      )}
      {step === 2 && hypercertUri && (
        <HypercertContributionForm
          hypercertUri={hypercertUri}
          onNext={() => setStep((step) => step + 1)}
          onBack={previousStepper}
        />
      )}
      {step === 3 && hypercertUri && (
        <HypercertEvidenceForm
          hypercertUri={hypercertUri}
          onNext={nextStepper}
          onBack={previousStepper}
        />
      )}
      {step === 4 && hypercertUri && (
        <HypercertLocationForm
          onNext={nextStepper}
          onBack={previousStepper}
          hypercertUri={hypercertUri}
        />
      )}
      {step === 5 && hypercertUri && (
        <HypercertRightsForm
          onNext={nextStepper}
          onBack={previousStepper}
          hypercertId={hypercertUri}
        />
      )}
      {step === 6 && (
        <HypercertCompletionStep
          onCreateAnother={() => setStep(1)}
          onBack={previousStepper}
          hypercertId={hypercertUri}
        />
      )}
    </div>
  );
}
