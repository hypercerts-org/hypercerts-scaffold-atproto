"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BaseHypercertFormProps } from "@/lib/types";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";
import LinkFileSelector from "./link-file-selector";
import { useAddLocationMutation } from "@/queries/hypercerts";
import { MapPin, Globe, Wand2 } from "lucide-react";

type LocationContentMode = "link" | "file";

export default function HypercertLocationForm({
  hypercertInfo,
  onBack,
  onNext,
}: BaseHypercertFormProps & {
  onBack?: () => void;
  onNext?: () => void;
}) {
  const [lpVersion, setLpVersion] = useState("1.0.0");
  const [srs, setSrs] = useState(
    "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
  );
  const [locationTypePreset, setLocationTypePreset] = useState<
    "coordinate-decimal" | "geojson-point" | "other"
  >("coordinate-decimal");
  const [locationTypeCustom, setLocationTypeCustom] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [contentMode, setContentMode] = useState<LocationContentMode>("link");
  const [locationUrl, setLocationUrl] = useState("");
  const [locationFile, setLocationFile] = useState<File | null>(null);

  const addLocationMutation = useAddLocationMutation({
    onSuccess: () => {
      onNext?.();
    },
  });

  const effectiveLocationType =
    locationTypePreset === "other"
      ? locationTypeCustom.trim() || "coordinate-decimal"
      : locationTypePreset;

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    setLocationFile(file ?? null);
  };

  const handleAutofill = () => {
    setLpVersion("1.0.0");
    setSrs("http://www.opengis.net/def/crs/OGC/1.3/CRS84");
    setLocationTypePreset("geojson-point");
    setName("Reforestation Site Alpha");
    setDescription(
      "Primary project location in the northern highlands region, covering approximately 25 hectares of reforestation area.",
    );
    setContentMode("link");
    setLocationUrl("https://example.com/location-data.geojson");
    setLocationFile(null);
    toast.success("Autofilled location form with sample data.");
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!hypercertInfo?.hypercertUri) {
      return;
    }

    if (!lpVersion.trim()) {
      toast.error("Location Protocol Version is required.");
      return;
    }
    if (!srs.trim()) {
      toast.error("Spatial Reference System (SRS) is required.");
      return;
    }
    if (!effectiveLocationType.trim()) {
      toast.error("Location Type is required.");
      return;
    }
    if (contentMode === "link" && !locationUrl.trim()) {
      toast.error("Please provide a link to the location data.");
      return;
    }
    if (contentMode === "file" && !locationFile) {
      toast.error("Please upload a location file.");
      return;
    }

    addLocationMutation.mutate({
      lpVersion: lpVersion.trim(),
      srs: srs.trim(),
      locationType: effectiveLocationType.trim(),
      createdAt: new Date().toISOString(),
      name: name.trim() || undefined,
      description: description.trim() || undefined,
      contentMode,
      locationUrl: contentMode === "link" ? locationUrl.trim() : undefined,
      locationFile:
        contentMode === "file" ? (locationFile ?? undefined) : undefined,
      hypercertUri: hypercertInfo.hypercertUri,
    });
  };

  return (
    <FormInfo
      stepLabel="Step 3 of 5"
      title="Add Location"
      description="Define the spatial context for this hypercert claim using a URI or uploaded location file."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Autofill */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutofill}
            className="gap-2 font-[family-name:var(--font-outfit)] text-xs"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Autofill Demo
          </Button>
        </div>

        {/* Protocol & SRS */}
        <div className="space-y-4">
          <div className="mb-1 flex items-center gap-2">
            <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
              <Globe className="text-create-accent h-3.5 w-3.5" />
            </div>
            <h3 className="text-muted-foreground font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wider uppercase">
              Spatial Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="lpVersion"
                className="font-[family-name:var(--font-outfit)] text-sm font-medium"
              >
                Location Protocol Version *
              </Label>
              <Input
                id="lpVersion"
                value={lpVersion}
                onChange={(e) => setLpVersion(e.target.value)}
                required
                className="font-[family-name:var(--font-outfit)]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="srs"
                className="font-[family-name:var(--font-outfit)] text-sm font-medium"
              >
                Spatial Reference System (SRS) URI *
              </Label>
              <Input
                id="srs"
                value={srs}
                onChange={(e) => setSrs(e.target.value)}
                required
                className="font-[family-name:var(--font-outfit)]"
              />
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
                e.g., http://www.opengis.net/def/crs/OGC/1.3/CRS84
              </p>
            </div>
          </div>
        </div>

        {/* Location Type */}
        <div className="space-y-3">
          <div className="mb-1 flex items-center gap-2">
            <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
              <MapPin className="text-create-accent h-3.5 w-3.5" />
            </div>
            <Label className="text-muted-foreground font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wider uppercase">
              Location Type *
            </Label>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <Button
              type="button"
              variant={
                locationTypePreset === "coordinate-decimal"
                  ? "default"
                  : "outline"
              }
              onClick={() => setLocationTypePreset("coordinate-decimal")}
              className="font-[family-name:var(--font-outfit)]"
            >
              coordinate-decimal
            </Button>
            <Button
              type="button"
              variant={
                locationTypePreset === "geojson-point" ? "default" : "outline"
              }
              onClick={() => setLocationTypePreset("geojson-point")}
              className="font-[family-name:var(--font-outfit)]"
            >
              geojson-point
            </Button>
            <Button
              type="button"
              variant={locationTypePreset === "other" ? "default" : "outline"}
              onClick={() => setLocationTypePreset("other")}
              className="font-[family-name:var(--font-outfit)]"
            >
              Other
            </Button>
          </div>
          {locationTypePreset === "other" && (
            <div className="animate-fade-in-up mt-2 space-y-1">
              <Input
                placeholder="Custom locationType identifier"
                value={locationTypeCustom}
                onChange={(e) => setLocationTypeCustom(e.target.value)}
                className="font-[family-name:var(--font-outfit)]"
              />
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
                Provide a format identifier, e.g., coordinate-utm,
                geojson-feature, etc.
              </p>
            </div>
          )}
        </div>

        {/* Name & Description */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="font-[family-name:var(--font-outfit)] text-sm font-medium"
            >
              Location Name (Optional)
            </Label>
            <Input
              id="name"
              placeholder="e.g., Kathmandu Office, Field Site A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={256}
              className="font-[family-name:var(--font-outfit)]"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="font-[family-name:var(--font-outfit)] text-sm font-medium"
            >
              Location Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the location, region coverage, or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="font-[family-name:var(--font-outfit)]"
            />
          </div>
        </div>

        {/* Location Data */}
        <LinkFileSelector
          label="Location Data *"
          fileUploadDisabled={false}
          mode={contentMode}
          onModeChange={setContentMode}
          urlPlaceholder="https://example.com/location.json"
          onUrlChange={setLocationUrl}
          onFileChange={handleFileChange}
          required
          urlHelpText="Link to a resource encoding the location (e.g., GeoJSON point, CSV with coordinates)."
          fileHelpText="Upload a file that contains location data. It will be stored as a blob."
          accept=".geojson,application/geo+json,application/json"
        />

        <FormFooter
          onBack={onBack}
          onSkip={onNext}
          submitLabel="Save & Next"
          savingLabel="Saving..."
          saving={addLocationMutation.isPending}
        />
      </form>
    </FormInfo>
  );
}
