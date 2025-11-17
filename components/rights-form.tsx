"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import * as Rights from "@/lexicons/types/org/hypercerts/claim/rights";
import * as HypercertClaim from "@/lexicons/types/org/hypercerts/claim";
import { getHypercert, updateHypercert } from "@/lib/queries";
import { validateHypercert } from "@/lib/utils";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ArrowLeft } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";

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
      rights: {
        $type: "com.atproto.repo.strongRef",
        cid: rightsCid,
        uri: rightsURI,
      },
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
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Add Hypercert Rights</CardTitle>
                <CardDescription className="mt-1">
                  Define the rights and usage terms associated with this
                  hypercert.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
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

              <div className="flex items-center justify-end gap-4 pt-2">
                {onBack ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                {!!onNext && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onNext}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                    Skip
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-[180px]"
                >
                  {saving ? "Saving…" : "Save Rights"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
