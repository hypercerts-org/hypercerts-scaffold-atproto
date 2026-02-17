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
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";
import LinkFileSelector from "./link-file-selector";
import { Button } from "./ui/button";
import { BaseHypercertFormProps } from "@/lib/types";
import { useAddAttachmentMutation } from "@/queries/hypercerts";
import { AttachmentLocationParam } from "@/lib/api/types";
import { MapPin, Wand2, FileText } from "lucide-react";

type ContentMode = "link" | "file";

const CONTENT_TYPES = [
  "evidence",
  "report",
  "audit",
  "testimonial",
  "methodology",
] as const;

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
  const [contentType, setContentType] = useState<string>("evidence");

  const [evidenceMode, setEvidenceMode] = useState<ContentMode>("link");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  // Location state
  const [locationMode, setLocationMode] = useState<
    "none" | "string" | "create"
  >("none");
  const [locationString, setLocationString] = useState("");

  // For create mode
  const [lpVersion, setLpVersion] = useState("1.0.0");
  const [srs, setSrs] = useState(
    "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
  );
  const [locationType, setLocationType] = useState<
    "coordinate-decimal" | "geojson-point" | "other"
  >("coordinate-decimal");
  const [locationTypeCustom, setLocationTypeCustom] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [locationContentMode, setLocationContentMode] = useState<
    "link" | "file"
  >("link");
  const [locationUrl, setLocationUrl] = useState("");
  const [locationFile, setLocationFile] = useState<File | null>(null);

  const addAttachmentMutation = useAddAttachmentMutation({
    onSuccess: () => {
      onNext?.();
    },
  });

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    setEvidenceFile(file ?? null);
  };

  const handleLocationFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ) => {
    const file = e.target.files?.[0];
    setLocationFile(file ?? null);
  };

  const handleLocationModeChange = (mode: "string" | "create") => {
    if (mode === "string") {
      setLocationName("");
      setLocationDescription("");
      setLocationUrl("");
      setLocationFile(null);
    } else {
      setLocationString("");
    }
    setLocationMode(mode);
  };

  const buildLocationParam = (): AttachmentLocationParam | undefined => {
    if (locationMode === "none") return undefined;

    if (locationMode === "string") {
      return locationString.trim() || undefined;
    }

    const effectiveLocationType =
      locationType === "other"
        ? locationTypeCustom.trim() || "coordinate-decimal"
        : locationType;

    const locationData =
      locationContentMode === "link" ? locationUrl.trim() : locationFile;

    if (!locationData) return undefined;

    return {
      lpVersion,
      srs,
      locationType: effectiveLocationType,
      location: locationData,
      ...(locationName.trim() && { name: locationName.trim() }),
      ...(locationDescription.trim() && {
        description: locationDescription.trim(),
      }),
    };
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

    if (contentType && !CONTENT_TYPES.includes(contentType as any)) {
      toast.error("Invalid content type.");
      return false;
    }

    return true;
  };

  const handleAutofill = () => {
    setTitle("Audit Report: Impact Verification");
    setContentType("audit");
    setShortDescription(
      "This audit report verifies the outputs and outcomes claimed by the hypercert, including methodology and third-party validation.",
    );
    setDescription(
      "This document provides an independent verification of the hypercert claim. It includes:\n\n- A breakdown of the methodology used\n- Supporting quantitative metrics\n- Third-party validation steps\n- References to supporting documentation and outcomes\n\nUse this evidence to substantiate the core claim and demonstrate credibility.",
    );

    setEvidenceMode("link");
    setEvidenceUrl("https://example.com/audit-report.pdf");
    setEvidenceFile(null);

    setLocationMode("create");
    setLocationName("Project Site");
    setLocationDescription("Primary verification location");
    setLocationContentMode("link");
    setLocationUrl("https://example.com/location.geojson");

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

    const location = buildLocationParam();

    addAttachmentMutation.mutate({
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      contentType: contentType || undefined,
      hypercertUri: hypercertInfo.hypercertUri,
      evidenceMode,
      evidenceUrl: evidenceMode === "link" ? evidenceUrl.trim() : undefined,
      evidenceFile:
        evidenceMode === "file" ? (evidenceFile ?? undefined) : undefined,
      location,
    });
  };

  return (
    <FormInfo
      stepLabel="Step 2 of 5"
      title="Add Evidence"
      description="Attach a link or file that backs up this hypercert claim."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Autofill */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutofill}
            className="gap-2 text-xs font-[family-name:var(--font-outfit)]"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Autofill Demo
          </Button>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label
            htmlFor="title"
            className="text-sm font-[family-name:var(--font-outfit)] font-medium"
          >
            Title *
          </Label>
          <Input
            id="title"
            placeholder="e.g., Audit report, Research paper, Demo video"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={256}
            required
            className="font-[family-name:var(--font-outfit)]"
          />
        </div>

        {/* Attachment Type */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-create-accent/10 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-create-accent" />
            </div>
            <Label
              htmlFor="contentType"
              className="text-sm font-[family-name:var(--font-outfit)] font-medium"
            >
              Attachment Type *
            </Label>
          </div>
          <Select
            value={contentType}
            onValueChange={(val) => setContentType(val)}
          >
            <SelectTrigger
              id="contentType"
              className="font-[family-name:var(--font-outfit)]"
            >
              <SelectValue placeholder="Choose the type of attachment..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="evidence">Evidence</SelectItem>
              <SelectItem value="report">Report</SelectItem>
              <SelectItem value="audit">Audit</SelectItem>
              <SelectItem value="testimonial">Testimonial</SelectItem>
              <SelectItem value="methodology">Methodology</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] font-[family-name:var(--font-outfit)] text-muted-foreground">
            Specify the type of attachment you are providing.
          </p>
        </div>

        {/* Short Description */}
        <div className="space-y-2">
          <Label
            htmlFor="shortDescription"
            className="text-sm font-[family-name:var(--font-outfit)] font-medium"
          >
            Short Description *
          </Label>
          <Textarea
            id="shortDescription"
            placeholder="Summarize what this evidence demonstrates..."
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={3000}
            rows={3}
            required
            className="font-[family-name:var(--font-outfit)]"
          />
          <p className="text-[11px] font-[family-name:var(--font-outfit)] text-muted-foreground">
            {shortDescription.length} / 3000 characters
          </p>
        </div>

        {/* Detailed Description */}
        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-sm font-[family-name:var(--font-outfit)] font-medium"
          >
            Detailed Description (Optional)
          </Label>
          <Textarea
            id="description"
            placeholder="Provide more context on the evidence and how it supports the claim..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={30000}
            rows={5}
            className="font-[family-name:var(--font-outfit)]"
          />
          <p className="text-[11px] font-[family-name:var(--font-outfit)] text-muted-foreground">
            {description.length} / 30000 characters
          </p>
        </div>

        {/* Evidence Content */}
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

        {/* Location Section */}
        <div className="space-y-5 pt-6 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-create-accent/10 flex items-center justify-center">
              <MapPin className="h-3.5 w-3.5 text-create-accent" />
            </div>
            <h3 className="text-sm font-[family-name:var(--font-syne)] font-semibold uppercase tracking-wider text-muted-foreground">
              Location
            </h3>
            <span className="text-[11px] font-[family-name:var(--font-outfit)] text-muted-foreground/60">
              Optional
            </span>
          </div>

          {/* Mode selector */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={locationMode === "string" ? "default" : "outline"}
                size="sm"
                onClick={() => handleLocationModeChange("string")}
                className="font-[family-name:var(--font-outfit)]"
              >
                Reference (AT-URI)
              </Button>
              <Button
                type="button"
                variant={locationMode === "create" ? "default" : "outline"}
                size="sm"
                onClick={() => handleLocationModeChange("create")}
                className="font-[family-name:var(--font-outfit)]"
              >
                Create New Location
              </Button>
              {locationMode !== "none" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLocationMode("none");
                    setLocationString("");
                    setLocationName("");
                    setLocationDescription("");
                    setLocationUrl("");
                    setLocationFile(null);
                  }}
                  className="font-[family-name:var(--font-outfit)] text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* String mode */}
          {locationMode === "string" && (
            <div className="space-y-2 animate-fade-in-up">
              <Label
                htmlFor="locationString"
                className="text-sm font-[family-name:var(--font-outfit)] font-medium"
              >
                Location Reference
              </Label>
              <Input
                id="locationString"
                type="text"
                placeholder="at://did:plc:xxx/app.certified.location/xxx"
                value={locationString}
                onChange={(e) => setLocationString(e.target.value)}
                className="font-[family-name:var(--font-outfit)]"
              />
              <p className="text-[11px] font-[family-name:var(--font-outfit)] text-muted-foreground">
                Enter an AT-URI to an existing location record
              </p>
            </div>
          )}

          {/* Create mode */}
          {locationMode === "create" && (
            <div className="space-y-4 animate-fade-in-up rounded-xl border border-border/60 bg-muted/20 p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="lpVersion"
                    className="text-sm font-[family-name:var(--font-outfit)] font-medium"
                  >
                    Location Protocol Version
                  </Label>
                  <Input
                    id="lpVersion"
                    value={lpVersion}
                    onChange={(e) => setLpVersion(e.target.value)}
                    className="font-[family-name:var(--font-outfit)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="srs"
                    className="text-sm font-[family-name:var(--font-outfit)] font-medium"
                  >
                    Spatial Reference System (SRS)
                  </Label>
                  <Input
                    id="srs"
                    value={srs}
                    onChange={(e) => setSrs(e.target.value)}
                    className="font-[family-name:var(--font-outfit)]"
                  />
                  <p className="text-[11px] font-[family-name:var(--font-outfit)] text-muted-foreground">
                    e.g., http://www.opengis.net/def/crs/OGC/1.3/CRS84
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-[family-name:var(--font-outfit)] font-medium">
                  Location Type
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={
                      locationType === "coordinate-decimal"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setLocationType("coordinate-decimal")}
                    className="font-[family-name:var(--font-outfit)]"
                  >
                    coordinate-decimal
                  </Button>
                  <Button
                    type="button"
                    variant={
                      locationType === "geojson-point" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setLocationType("geojson-point")}
                    className="font-[family-name:var(--font-outfit)]"
                  >
                    geojson-point
                  </Button>
                  <Button
                    type="button"
                    variant={locationType === "other" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocationType("other")}
                    className="font-[family-name:var(--font-outfit)]"
                  >
                    Other
                  </Button>
                </div>
                {locationType === "other" && (
                  <Input
                    placeholder="Custom locationType identifier"
                    value={locationTypeCustom}
                    onChange={(e) => setLocationTypeCustom(e.target.value)}
                    className="mt-2 font-[family-name:var(--font-outfit)]"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="locationName"
                  className="text-sm font-[family-name:var(--font-outfit)] font-medium"
                >
                  Location Name (Optional)
                </Label>
                <Input
                  id="locationName"
                  placeholder="e.g., Project Site, Field Location"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  maxLength={256}
                  className="font-[family-name:var(--font-outfit)]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="locationDescription"
                  className="text-sm font-[family-name:var(--font-outfit)] font-medium"
                >
                  Location Description (Optional)
                </Label>
                <Textarea
                  id="locationDescription"
                  placeholder="Describe the location context..."
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  rows={2}
                  className="font-[family-name:var(--font-outfit)]"
                />
              </div>

              <LinkFileSelector
                label="Location Data"
                fileUploadDisabled={false}
                mode={locationContentMode}
                onModeChange={setLocationContentMode}
                urlPlaceholder="https://example.com/location.geojson"
                onUrlChange={setLocationUrl}
                onFileChange={handleLocationFileChange}
                urlHelpText="Link to a resource encoding the location (e.g., GeoJSON, coordinates)."
                fileHelpText="Upload a file containing location data."
                accept=".geojson,application/geo+json,application/json"
              />
            </div>
          )}
        </div>

        <FormFooter
          onBack={onBack}
          onSkip={onNext}
          submitLabel="Save & Next"
          savingLabel="Saving..."
          saving={addAttachmentMutation.isPending}
        />
      </form>
    </FormInfo>
  );
}
