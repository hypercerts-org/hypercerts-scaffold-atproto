"use client";

import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { useState } from "react";
import { toast } from "sonner";

import * as HypercertRecord from "@/lexicons/types/org/hypercerts/claim";
import HypercertsBaseForm, {
  HypercertRecordForm,
} from "./hypercerts-base-form";

type HypercertDetailsFormProps = {
  hypercertId: string;
  initialRecord?: HypercertRecord.Record;
  onSaved?: (args: { advance: boolean }) => void;
};

export default function HypercertDetailsForm({
  hypercertId,
  initialRecord,
  onSaved,
}: HypercertDetailsFormProps) {
  const { atProtoAgent } = useOAuthContext();
  const [saving, setSaving] = useState(false);

  async function saveRecord(certInfo: HypercertRecordForm, advance?: boolean) {
    if (!atProtoAgent) return;
    const {
      title,
      workTimeFrameFrom,
      workTimeFrameTo,
      workScope,
      shortDescription,
    } = certInfo;
    if (!initialRecord?.createdAt) {
      return;
    }

    try {
      setSaving(true);
      const record: HypercertRecord.Record = {
        ...(initialRecord || {}),
        $type: "org.hypercerts.claim",
        title,
        shortDescription,
        workScope,
        workTimeFrameFrom,
        workTimeFrameTo,
      };
      if (
        HypercertRecord.isRecord(record) &&
        HypercertRecord.validateRecord(record).success
      ) {
        await atProtoAgent.com.atproto.repo.putRecord({
          repo: atProtoAgent.assertDid,
          collection: "org.hypercerts.claim",
          rkey: hypercertId,
          record,
        });
        toast.success("Hypercert saved");
        onSaved?.({ advance: !!advance });
      } else {
        const validation = HypercertRecord.validateRecord(record);
        if (!validation.success) {
          toast.error(validation.error.message);
        } else {
          toast.error("Invalid hypercert data, please check your inputs.");
        }
      }
    } catch (error) {
      console.error("Error updating hypercert:", error);
      toast.error(
        error instanceof Error ? error?.message : "Failed to update hypercert"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <HypercertsBaseForm
      updateActions
      onSave={saveRecord}
      isSaving={saving}
      saveDisabled={false}
      certInfo={initialRecord}
    />
  );
}
