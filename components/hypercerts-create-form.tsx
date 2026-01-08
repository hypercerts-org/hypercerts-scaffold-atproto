import * as HypercertRecord from "@/lexicons/types/org/hypercerts/claim/activity";
import { parseAtUri } from "@/lib/utils";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { BlobRef } from "@atproto/lexicon";
import { useState } from "react";
import { toast } from "sonner";
import HypercertsBaseForm, {
  HypercertRecordForm,
} from "./hypercerts-base-form";
import { createHypercert, uploadFile } from "@/lib/queries";
import FormInfo from "./form-info";
import { Collections } from "@/lib/types";
import { title } from "process";
import { createHypercertUsingSDK } from "@/lib/create-actions";
import {
  CreateHypercertParams,
  CreateHypercertResult,
} from "@hypercerts-org/sdk-core";

export interface IHypercertsCreateFormProps {
  setHypercertId: (id: string) => void;
  hypercertUri?: string;
  setHypercertUri: (uri: string) => void;
  nextStepper: () => void;
  setHypercertInfo: (info: CreateHypercertResult) => void;
}

export default function HypercertsCreateForm({
  setHypercertId,
  hypercertUri,
  setHypercertUri,
  setHypercertInfo,
  nextStepper,
}: IHypercertsCreateFormProps) {
  const [creating, setCreating] = useState(false);

  const handleCreate = async (
    certInfo: CreateHypercertParams,
    advance?: boolean
  ) => {
    try {
      setCreating(true);
      const formData = new FormData();
      formData.append("title", certInfo.title);
      formData.append("shortDescription", certInfo.shortDescription);
      formData.append(
        "description",
        certInfo.description ?? certInfo.shortDescription
      );
      formData.append("startDate", certInfo.startDate);
      formData.append("endDate", certInfo.endDate);
      formData.append("rights", JSON.stringify(certInfo.rights));
      if (certInfo.image) {
        formData.append("image", certInfo.image);
      }

      const res = await fetch("/api/certs/create", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = (await res.json()).error;
        throw new Error(error || "Failed to create hypercert");
      }
      const data = (await res.json()) as CreateHypercertResult;
      setHypercertInfo(data);
      setHypercertUri(data.hypercertUri);
      toast.success("Hypercert created successfully!");
      if (advance) nextStepper();
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        toast.error(e.message);
      } else {
        toast.error("Failed to create hypercert please try again");
      }
    } finally {
      setCreating(false);
    }
  };

  // const handleCreate = async (
  //   certInfo: HypercertRecordForm,
  //   advance?: boolean
  // ) => {
  //   try {
  //     if (!atProtoAgent || !session) return;
  //     setCreating(true);
  //     const {
  //       title,
  //       shortDescription,
  //       workScope,
  //       workTimeFrameFrom,
  //       workTimeFrameTo,
  //     } = certInfo;
  //     let uploadedBlob: BlobRef | undefined = undefined;
  //     const image = certInfo.image;
  //     uploadedBlob = await uploadFile(atProtoAgent, image);
  //     const record = {
  //       $type: Collections.claim,
  //       title,
  //       shortDescription,
  //       workScope,
  //       image: uploadedBlob ? { $type: "smallBlob", ...uploadedBlob } : null,
  //       workTimeFrameFrom,
  //       workTimeFrameTo,
  //       createdAt: new Date().toISOString(),
  //     };
  //     const isProperRecord = HypercertRecord.isRecord(record);
  //     const validation = HypercertRecord.validateRecord(record);
  //     if (isProperRecord && validation.success) {
  //       const response = await createHypercert(atProtoAgent, record);
  //       const uriInfo = parseAtUri(response.data.uri);
  //       if (uriInfo?.rkey) {
  //         setHypercertId(uriInfo?.rkey);
  //       }
  //       toast.success("Hypercert created successfully!");
  //       if (advance) {
  //         nextStepper();
  //       }
  //     } else {
  //       if (!validation.success) {
  //         toast.error(validation.error.message);
  //       } else {
  //         toast.error("Invalid hypercert data, please check your inputs.");
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error creating hypercert:", error);
  //     toast.error(
  //       error instanceof Error
  //         ? error.message
  //         : "Failed to create hypercert please try again"
  //     );
  //   } finally {
  //     setCreating(false);
  //   }
  // };
  return (
    <FormInfo
      description="These details need to be filled out to crete a hypercert."
      title={"Create HyperCert"}
    >
      <HypercertsBaseForm
        updateActions
        hypercertUri={hypercertUri}
        nextStepper={nextStepper}
        isSaving={creating}
        saveDisabled={false}
        onSave={handleCreate}
      />
    </FormInfo>
  );
}
