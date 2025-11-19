"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import * as HypercertClaim from "@/lexicons/types/org/hypercerts/claim";
import * as Evidence from "@/lexicons/types/org/hypercerts/claim/evidence";
import { createEvidence, getHypercert, updateHypercert } from "@/lib/queries";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ComAtprotoRepoCreateRecord } from "@atproto/api";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";
import LinkFileSelector from "./link-file-selector";

type ContentMode = "link" | "file";

export default function HypercertEvidenceForm({
  hypercertId,
  onNext,
  onBack,
}: {
  hypercertId: string;
  onNext?: () => void;
  onBack?: () => void;
}) {
  const { atProtoAgent } = useOAuthContext();

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceMode, setEvidenceMode] = useState<ContentMode>("link");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    setEvidenceFile(file ?? null);
  };

  const getEvidenceContent = async () => {
    if (evidenceMode === "link") {
      if (!evidenceUrl.trim()) {
        toast.error("Please provide a link to the evidence.");
        setSaving(false);
        return;
      }
      return { $type: "app.certified.defs#uri", value: evidenceUrl.trim() };
    } else {
      if (!evidenceFile) {
        toast.error("Please upload an evidence file.");
        setSaving(false);
        return;
      }
      const blob = new Blob([evidenceFile], { type: evidenceFile.type });
      const response = await atProtoAgent!.com.atproto.repo.uploadBlob(blob);
      const uploadedBlob = response.data.blob;
      return { $type: "smallBlob", ...uploadedBlob };
    }
  };

  const buildUpdatedHyperCert = async (
    evidenceData: ComAtprotoRepoCreateRecord.Response
  ) => {
    const evidenceCid = evidenceData?.data?.cid;
    const evidenceURI = evidenceData?.data?.uri;

    if (!evidenceCid || !evidenceURI) {
      toast.error("Failed to create evidence record");
      setSaving(false);
      return;
    }

    const hypercertData = await getHypercert(hypercertId, atProtoAgent!);
    const updatedHypercert = {
      ...hypercertData.data.value,
      evidence: [
        {
          $type: "com.atproto.repo.strongRef",
          cid: evidenceCid,
          uri: evidenceURI,
        },
      ],
    };
    return updatedHypercert;
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!atProtoAgent) return;
    try {
      setSaving(true);
      const content = await getEvidenceContent();
      const evidenceRecord = {
        $type: "org.hypercerts.claim.evidence",
        content,
        title: title || undefined,
        shortDescription,
        description: description || undefined,
        createdAt: new Date().toISOString(),
      } as Evidence.Record;
      const validation = Evidence.validateRecord(evidenceRecord);
      if (!validation.success) {
        toast.error(validation.error?.message || "Invalid evidence record");
        setSaving(false);
        return;
      }

      const createResponse = await createEvidence(atProtoAgent, evidenceRecord);
      const updatedHypercert = await buildUpdatedHyperCert(createResponse);
      if (!updatedHypercert) return;
      await updateHypercert(
        hypercertId,
        atProtoAgent,
        updatedHypercert as HypercertClaim.Record
      );
      toast.success("Evidence created and linked to hypercert!");
      onNext?.();
    } catch (error) {
      console.error("Error saving evidence:", error);
      toast.error("Failed to create evidence");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormInfo
      title="Add Hypercert Evidence"
      description="Attach a link of file that backs up this hypercert claim"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title (Optional)</Label>
          <Input
            id="title"
            placeholder="e.g., Audit report, Research paper, Demo video"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={256}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short Description (Required)</Label>
          <Textarea
            id="shortDescription"
            placeholder="Summarize what this evidence demonstrates..."
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={3000}
            rows={3}
            required
          />
          <p className="text-xs text-muted-foreground">
            {shortDescription.length} / 3000 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Detailed Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Provide more context on the evidence and how it supports the claim..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={30000}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            {description.length} / 30000 characters
          </p>
        </div>

        <LinkFileSelector
          label="Evidence Content *"
          mode={evidenceMode}
          onModeChange={setEvidenceMode}
          urlPlaceholder="https://example.com/location.json"
          onUrlChange={setEvidenceUrl}
          onFileChange={handleFileChange}
          required
          urlHelpText="Paste a URL to a public resource (report, article, repo, video, etc.)."
          fileHelpText="Upload a supporting file (PDF, image, etc.). It will be stored as a blob."
        />
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
