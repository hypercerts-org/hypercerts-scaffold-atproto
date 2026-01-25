import {
  CreateHypercertParams,
  CreateHypercertResult,
} from "@hypercerts-org/sdk-core";
import { useState } from "react";
import { toast } from "sonner";
import FormInfo from "./form-info";
import HypercertsBaseForm from "./hypercerts-base-form";

export interface IHypercertsCreateFormProps {
  hypercertInfo?: CreateHypercertResult;
  nextStepper: () => void;
  setHypercertInfo: (info: CreateHypercertResult) => void;
}

export default function HypercertsCreateForm({
  hypercertInfo,
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
      formData.append("workScope", JSON.stringify(certInfo.workScope));

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

  return (
    <FormInfo
      description="These details need to be filled out to crete a hypercert."
      title={"Create HyperCert"}
    >
      <HypercertsBaseForm
        updateActions
        hypercertUri={hypercertInfo?.hypercertUri}
        nextStepper={nextStepper}
        isSaving={creating}
        saveDisabled={false}
        onSave={handleCreate}
      />
    </FormInfo>
  );
}
