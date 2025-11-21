import * as HypercertRecord from "@/lexicons/types/org/hypercerts/claim";
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

export interface IHypercertsCreateFormProps {
  setHypercertId: (id: string) => void;
  nextStepper: () => void;
}

export default function HypercertsCreateForm({
  setHypercertId,
  nextStepper,
}: IHypercertsCreateFormProps) {
  const { atProtoAgent, session } = useOAuthContext();
  const [creating, setCreating] = useState(false);

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
      let uploadedBlob: BlobRef | undefined = undefined;
      const image = certInfo.image;
      uploadedBlob = await uploadFile(atProtoAgent, image);
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
      const isProperRecord = HypercertRecord.isRecord(record);
      const validation = HypercertRecord.validateRecord(record);
      if (isProperRecord && validation.success) {
        const response = await createHypercert(atProtoAgent, record);
        const uriInfo = parseAtUri(response.data.uri);
        if (uriInfo?.rkey) {
          setHypercertId(uriInfo?.rkey);
        }
        toast.success("Hypercert created successfully!");
        if (advance) {
          nextStepper();
        }
      } else {
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
    <FormInfo
      description="These details need to be filled out to crete a hypercert."
      title={"Create HyperCert"}
    >
      <HypercertsBaseForm
        updateActions
        isSaving={creating}
        saveDisabled={false}
        onSave={handleCreate}
      />
    </FormInfo>
  );
}
