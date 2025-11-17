"use client";

import HypercertContributionForm from "@/components/contributions-form";
import { StepperHeader } from "@/components/edit-cert-stepper";
import HypercertsBaseForm, {
  HypercertRecordForm,
} from "@/components/hypercerts-base-form";
import * as HypercertRecord from "@/lexicons/types/org/hypercerts/claim";
import { parseAtUri } from "@/lib/utils";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { BlobRef } from "@atproto/lexicon";
import { useState } from "react";
import { toast } from "sonner";
import { CertData } from "../[hypercertId]/edit/page";
import HypercertEvidenceForm from "@/components/evidence-form";
import HypercertLocationForm from "@/components/locations-form";

export default function Home() {
  const { atProtoAgent, session } = useOAuthContext();
  const [step, setStep] = useState<number>(4);
  const [creating, setCreating] = useState(false);
  const [hypercertId, setHypercertId] = useState<string>();
  const [certData, setCertData] = useState<CertData>();

  const handleCreate = async (
    certInfo: HypercertRecordForm,
    advance?: boolean
  ) => {
    try {
      if (!atProtoAgent || !session) return;
      setCreating(true);
      const {
        title,
        shortDescription,
        workScope,
        workTimeFrameFrom,
        workTimeFrameTo,
      } = certInfo;
      let uploadedBlob: BlobRef | null = null;
      const image = certInfo.image;
      if (image) {
        const blob = new Blob([image!], { type: image?.type });
        const response = await atProtoAgent.com.atproto.repo.uploadBlob(blob);
        uploadedBlob = response.data.blob;
      }
      const record = {
        $type: "org.hypercerts.claim",
        title,
        shortDescription,
        workScope,
        image: uploadedBlob ? { $type: "smallBlob", ...uploadedBlob } : null,
        workTimeFrameFrom,
        workTimeFrameTo,
        createdAt: new Date().toISOString(),
      };
      if (
        HypercertRecord.isRecord(record) &&
        HypercertRecord.validateRecord(record).success
      ) {
        const response = await atProtoAgent.com.atproto.repo.createRecord({
          rkey: new Date().getTime().toString(),
          record,
          collection: "org.hypercerts.claim",
          repo: atProtoAgent.assertDid,
        });
        const uriInfo = parseAtUri(response.data.uri);
        if (uriInfo?.rkey) {
          const response = await atProtoAgent.com.atproto.repo.getRecord({
            repo: atProtoAgent.assertDid,
            collection: "org.hypercerts.claim",
            rkey: uriInfo.rkey,
          });
          setHypercertId(uriInfo.rkey);
          setCertData(response?.data as CertData);
        }
        toast.success("Hypercert created successfully!");
        if (advance) {
          setStep((step) => step + 1);
        }
      } else {
        const validation = HypercertRecord.validateRecord(record);
        if (!validation.success) {
          toast.error(validation.error.message);
        } else {
          toast.error("Invalid hypercert data, please check your inputs.");
        }
      }
    } catch (error) {
      console.error("Error creating hypercert:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create hypercert please try again"
      );
    } finally {
      setCreating(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <StepperHeader step={step} />
      {step === 1 && (
        <HypercertsBaseForm
          updateActions
          isSaving={creating}
          saveDisabled={false}
          onSave={handleCreate}
        />
      )}
      {step === 2 && hypercertId && certData && (
        <div className="mt-6">
          <HypercertContributionForm
            hypercertId={hypercertId}
            hypercertData={certData}
            onSkip={() => setStep((step) => step + 1)}
            onBack={() => setStep(1)}
          />
        </div>
      )}
      {step === 3 && hypercertId && certData && (
        <div className="mt-6">
          <HypercertEvidenceForm
            hypercertId={hypercertId}
            hypercertData={certData}
            onBack={() => setStep(2)}
          />
        </div>
      )}
      {step === 4 && (
        <div className="mt-6">
          <HypercertLocationForm hypercertId={hypercertId} />
        </div>
      )}
    </div>
  );
}
