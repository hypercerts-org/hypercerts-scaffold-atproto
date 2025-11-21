"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import * as HypercertClaim from "@/lexicons/types/org/hypercerts/claim";
import * as Rights from "@/lexicons/types/org/hypercerts/claim/rights";
import { getHypercert, updateHypercert } from "@/lib/queries";
import { buildStrongRef, validateHypercert } from "@/lib/utils";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";

export default function HypercertRightsForm({
  hypercertId,
  onBack,
  onNext,
}: {
  hypercertId: string;
  onBack?: () => void;
  onNext?: () => void;
}) {
  const { atProtoAgent } = useOAuthContext();

  const [rightsName, setRightsName] = useState("");
  const [rightsType, setRightsType] = useState("");
  const [rightsDescription, setRightsDescription] = useState("");

  const [saving, setSaving] = useState(false);

  const handleRightsCreation = async () => {
    if (!atProtoAgent) return;
    const rightsRecord: Rights.Record = {
      $type: "org.hypercerts.claim.rights",
      rightsName,
      rightsType,
      rightsDescription,
      createdAt: new Date().toISOString(),
    };

    const validation = Rights.validateRecord(rightsRecord);
    if (!validation.success) {
      toast.error(validation.error?.message || "Invalid rights record");
      setSaving(false);
      return;
    }

    const createResponse = await atProtoAgent.com.atproto.repo.createRecord({
      rkey: String(Date.now()),
      record: rightsRecord,
      collection: "org.hypercerts.claim.rights",
      repo: atProtoAgent.assertDid,
    });

    const rightsCid = createResponse?.data?.cid;
    const rightsURI = createResponse?.data?.uri;
    if (!rightsCid || !rightsURI) {
      toast.error("Failed to create rights record");
      setSaving(false);
      return;
    }
    return { rightsCid, rightsURI };
  };

  const handleCreate = async (rightsCid: string, rightsURI: string) => {
    if (!atProtoAgent) return;
    const hypercert = await getHypercert(hypercertId, atProtoAgent);
    const hypercertRecord = hypercert.data.value || {};
    const updatedHypercert = {
      ...hypercertRecord,
      rights: buildStrongRef(rightsCid, rightsURI),
    } as HypercertClaim.Record;

    const hypercertValidation = validateHypercert(updatedHypercert);
    if (!hypercertValidation.success) {
      toast.error(
        hypercertValidation.error || "Invalid updated hypercert record"
      );
      setSaving(false);
      return;
    }

    await updateHypercert(hypercertId, atProtoAgent, updatedHypercert);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!atProtoAgent) return;

    try {
      setSaving(true);
      const { rightsCid, rightsURI } = (await handleRightsCreation()) || {};
      if (!rightsCid || !rightsURI) return;
      await handleCreate(rightsCid, rightsURI);
      toast.success("Rights created and linked to hypercert!");
      onNext?.();
    } catch (error) {
      console.error("Error saving rights:", error);
      toast.error("Failed to create rights");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormInfo
      title="Add Hypercert Rights"
      description="Define the rights and usage terms associated with this hypercert."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="rightsName">Rights Name *</Label>
          <Input
            id="rightsName"
            placeholder="e.g., Creative Commons Attribution-ShareAlike 4.0"
            value={rightsName}
            onChange={(e) => setRightsName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rightsType">Rights Identifier *</Label>
          <Input
            id="rightsType"
            placeholder="e.g., cc-by-sa-4.0, all-rights-reserved"
            value={rightsType}
            maxLength={10}
            onChange={(e) => setRightsType(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rightsDescription">Rights Description *</Label>
          <Textarea
            id="rightsDescription"
            placeholder="Describe how this hypercert can be used, shared, or remixed..."
            value={rightsDescription}
            onChange={(e) => setRightsDescription(e.target.value)}
            rows={5}
            required
          />
        </div>
        <FormFooter
          onBack={onBack}
          onSkip={onNext}
          submitLabel="Save & Next"
          savingLabel="Saving…"
          saving={saving}
        />
      </form>
    </FormInfo>
  );
}
