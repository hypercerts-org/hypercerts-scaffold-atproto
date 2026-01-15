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
    "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
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

  const [saving, setSaving] = useState(false);

  const effectiveLocationType =
    locationTypePreset === "other"
      ? locationTypeCustom.trim() || "coordinate-decimal"
      : locationTypePreset;

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    setLocationFile(file ?? null);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!hypercertInfo?.hypercertUri) {
      return;
    }
    try {
      setSaving(true);
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
      const formData = new FormData();
      formData.append("lpVersion", lpVersion.trim());
      formData.append("srs", srs.trim());
      formData.append("locationType", effectiveLocationType.trim());
      formData.append("createdAt", new Date().toISOString());

      if (name.trim()) formData.append("name", name.trim());
      if (description.trim())
        formData.append("description", description.trim());
      formData.append("contentMode", contentMode);

      if (contentMode === "link") {
        formData.append("locationUrl", locationUrl.trim());
      } else {
        formData.append("locationFile", locationFile as File);
      }
      formData.append("hypercertUri", hypercertInfo?.hypercertUri);
      const response = await fetch("/api/certs/add-location", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      console.log(result);
      toast.success("Location Added Successfully");
      onNext?.(); 
    } catch (error) {
      console.error("Error assembling FormData:", error);
      toast.error("Failed to assemble FormData");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormInfo
      title="Add Hypercert Location"
      description="Define the spatial context for this hypercert claim using a URI or uploaded location file."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lpVersion">Location Protocol Version *</Label>
            <Input
              id="lpVersion"
              value={lpVersion}
              onChange={(e) => setLpVersion(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="srs">Spatial Reference System (SRS) URI *</Label>
            <Input
              id="srs"
              value={srs}
              onChange={(e) => setSrs(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              e.g., http://www.opengis.net/def/crs/OGC/1.3/CRS84
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Location Type *</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button
              type="button"
              variant={
                locationTypePreset === "coordinate-decimal"
                  ? "default"
                  : "outline"
              }
              onClick={() => setLocationTypePreset("coordinate-decimal")}
            >
              coordinate-decimal
            </Button>
            <Button
              type="button"
              variant={
                locationTypePreset === "geojson-point" ? "default" : "outline"
              }
              onClick={() => setLocationTypePreset("geojson-point")}
            >
              geojson-point
            </Button>
            <Button
              type="button"
              variant={locationTypePreset === "other" ? "default" : "outline"}
              onClick={() => setLocationTypePreset("other")}
            >
              Other
            </Button>
          </div>
          {locationTypePreset === "other" && (
            <div className="space-y-1 mt-2">
              <Input
                placeholder="Custom locationType identifier"
                value={locationTypeCustom}
                onChange={(e) => setLocationTypeCustom(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Provide a format identifier, e.g., coordinate-utm,
                geojson-feature, etc.
              </p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Location Name (Optional)</Label>
          <Input
            id="name"
            placeholder="e.g., Kathmandu Office, Field Site A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={256}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Location Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Describe the location, region coverage, or context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        <LinkFileSelector
          label="Location Data *"
          mode={contentMode}
          onModeChange={setContentMode}
          urlPlaceholder="https://example.com/location.json"
          onUrlChange={setLocationUrl}
          onFileChange={handleFileChange}
          required
          urlHelpText="Link to a resource encoding the location (e.g., GeoJSON point, CSV with coordinates)."
          fileHelpText="Upload a file that contains location data. It will be stored as a blob."
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
