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
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";
import LinkFileSelector from "./link-file-selector";
import { Button } from "./ui/button";
import { BaseHypercertFormProps } from "@/lib/types";
import { useAddEvidenceMutation } from "@/queries/hypercerts";

type ContentMode = "link" | "file";

const RELATION_TYPES: HypercertEvidence["relationType"][] = [
  "supports",
  "challenges",
  "clarifies",
];

export default function HypercertEvidenceForm({
  hypercertInfo,
  onNext,
  onBack,
}: BaseHypercertFormProps & {
  onNext?: () => void;
  onBack?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [relationType, setRelationType] = useState<
    HypercertEvidence["relationType"] | ""
  >("supports");

  const [evidenceMode, setEvidenceMode] = useState<ContentMode>("link");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const addEvidenceMutation = useAddEvidenceMutation({
    onSuccess: () => {
      onNext?.();
    },
  });

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

    if (!validateTextFields() || !hypercertInfo?.hypercertUri) {
      return;
    }

    if (evidenceMode === "link" && !evidenceUrl.trim()) {
      toast.error("Please provide a link to the evidence.");
      return;
    }
    if (evidenceMode === "file" && !evidenceFile) {
      toast.error("Please upload an evidence file.");
      return;
    }

    addEvidenceMutation.mutate({
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      relationType: relationType || undefined,
      hypercertUri: hypercertInfo.hypercertUri,
      evidenceMode,
      evidenceUrl: evidenceMode === "link" ? evidenceUrl.trim() : undefined,
      evidenceFile: evidenceMode === "file" ? evidenceFile ?? undefined : undefined,
    });
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
          fileUploadDisabled={false}
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
          savingLabel="Saving..."
          saving={addEvidenceMutation.isPending}
        />
      </form>
    </FormInfo>
  );
}
