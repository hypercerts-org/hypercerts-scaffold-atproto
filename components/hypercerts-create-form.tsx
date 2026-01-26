import {
  CreateHypercertParams,
  CreateHypercertResult,
} from "@hypercerts-org/sdk-core";
import FormInfo from "./form-info";
import HypercertsBaseForm from "./hypercerts-base-form";
import { useCreateHypercertMutation } from "@/queries/hypercerts";

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
  const createMutation = useCreateHypercertMutation({
    onSuccess: (data) => {
      setHypercertInfo(data);
    },
  });

  const handleCreate = async (
    certInfo: CreateHypercertParams,
    advance?: boolean
  ) => {
    createMutation.mutate(certInfo, {
      onSuccess: () => {
        if (advance) nextStepper();
      },
    });
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
        isSaving={createMutation.isPending}
        saveDisabled={false}
        onSave={handleCreate}
      />
    </FormInfo>
  );
}
