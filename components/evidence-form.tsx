"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { HypercertEvidence } from "@hypercerts-org/sdk-core";

import * as Evidence from "@/lexicons/types/org/hypercerts/claim/evidence";

import { getHypercert } from "@/lib/queries";
import { buildStrongRef } from "@/lib/utils";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ComAtprotoRepoCreateRecord } from "@atproto/api";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";
import LinkFileSelector from "./link-file-selector";
import { Button } from "./ui/button";

type ContentMode = "link" | "file";

const RELATION_TYPES: Evidence.Record["relationType"][] = [
  "supports",
  "challenges",
  "clarifies",
];

export default function HypercertEvidenceForm({
  hypercertUri: hypercertId,
  onNext,
  onBack,
}: {
  hypercertUri: string;
  onNext?: () => void;
  onBack?: () => void;
}) {
  const { atProtoAgent } = useOAuthContext();

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [relationType, setRelationType] = useState<
    HypercertEvidence["relationType"] | ""
  >("supports");

  const [evidenceMode, setEvidenceMode] = useState<ContentMode>("link");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    setEvidenceFile(file ?? null);
  };

  const validateTextFields = () => {
    const titleTrimmed = title.trim();

    if (!titleTrimmed) {
      toast.error("Title is required.");
      return false;
    }
    if (titleTrimmed.length > 256) {
      toast.error("Title must be at most 256 characters.");
      return false;
    }

    if (!shortDescription.trim()) {
      toast.error("Short description is required.");
      return false;
    }
    if (shortDescription.length > 3000) {
      toast.error("Short description must be at most 3000 characters.");
      return false;
    }

    if (description.length > 30000) {
      toast.error("Detailed description must be at most 30000 characters.");
      return false;
    }

    if (relationType && !RELATION_TYPES.includes(relationType)) {
      toast.error("Invalid relation type.");
      return false;
    }

    return true;
  };

  const getEvidenceContent = async () => {
    if (evidenceMode === "link") {
      if (!evidenceUrl.trim()) {
        toast.error("Please provide a link to the evidence.");
        return;
      }
      return { $type: "org.hypercerts.defs#uri", value: evidenceUrl.trim() };
    }

    if (!evidenceFile) {
      toast.error("Please upload an evidence file.");
      return;
    }

    const blob = new Blob([evidenceFile], { type: evidenceFile.type });
    const response = await atProtoAgent!.com.atproto.repo.uploadBlob(blob);
    const uploadedBlob = response.data.blob;

    return { $type: "org.hypercerts.defs#smallBlob", ...uploadedBlob };
  };

  const buildSubjectStrongRef = async () => {
    const hypercertData = await getHypercert(hypercertId, atProtoAgent!);

    const hypercertCid = hypercertData?.data?.cid;
    const hypercertUri = hypercertData?.data?.uri;

    if (!hypercertCid || !hypercertUri) {
      toast.error("Unable to load hypercert reference for subject.");
      return;
    }

    return buildStrongRef(hypercertCid, hypercertUri);
  };

  const buildUpdatedHyperCert = async (
    evidenceData: ComAtprotoRepoCreateRecord.Response
  ) => {
    const evidenceCid = evidenceData?.data?.cid;
    const evidenceURI = evidenceData?.data?.uri;

    if (!evidenceCid || !evidenceURI) {
      toast.error("Failed to create evidence record");
      return;
    }

    const hypercertData = await getHypercert(hypercertId, atProtoAgent!);
    const existingEvidence = hypercertData.data.value.evidence ?? [];

    const updatedHypercert = {
      ...hypercertData.data.value,
      evidence: [...existingEvidence, buildStrongRef(evidenceCid, evidenceURI)],
    };

    return updatedHypercert;
  };

  const handleAutofill = () => {
    setTitle("Audit Report: Impact Verification");
    setRelationType("supports");
    setShortDescription(
      "This audit report verifies the outputs and outcomes claimed by the hypercert, including methodology and third-party validation."
    );
    setDescription(
      "This document provides an independent verification of the hypercert claim. It includes:\n\n- A breakdown of the methodology used\n- Supporting quantitative metrics\n- Third-party validation steps\n- References to supporting documentation and outcomes\n\nUse this evidence to substantiate the core claim and demonstrate credibility."
    );

    // Evidence: enforce link mode (files not supported yet)
    setEvidenceMode("link");
    setEvidenceUrl("https://example.com/audit-report.pdf");
    setEvidenceFile(null);

    toast.success("Autofilled evidence form with sample data.");
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (!validateTextFields()) {
        return;
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("shortDescription", shortDescription.trim());
      formData.append("description", description.trim());
      if (relationType) {
        formData.append("relationType", relationType);
      }
      formData.append("hypercertUri", hypercertId);

      if (evidenceMode === "link") {
        if (!evidenceUrl.trim()) {
          toast.error("Please provide a link to the evidence.");
          return;
        }
        formData.append("evidenceUrl", evidenceUrl.trim());
      } else {
        if (!evidenceFile) {
          toast.error("Please upload an evidence file.");
          return;
        }
        formData.append("evidenceFile", evidenceFile);
      }
      await fetch("/api/certs/add-evidence", {
        method: "POST",
        body: formData,
      });
      onNext?.();
    } catch (err) {
      console.error("Error assembling FormData:", err);
      toast.error("Failed to assemble FormData");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormInfo
      title="Add Hypercert Evidence"
      description="Attach a link or file that backs up this hypercert claim"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutofill}
          >
            Autofill example
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Audit report, Research paper, Demo video"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={256}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationType">Relation Type *</Label>
          <Select
            value={relationType}
            onValueChange={(val) =>
              setRelationType(val as HypercertEvidence["relationType"])
            }
          >
            <SelectTrigger id="relationType">
              <SelectValue placeholder="Choose how this evidence relates..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supports">Supports</SelectItem>
              <SelectItem value="clarifies">Clarifies</SelectItem>
              <SelectItem value="challenges">Challenges</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Specify whether this evidence supports, clarifies, or challenges the
            claim.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short Description *</Label>
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
