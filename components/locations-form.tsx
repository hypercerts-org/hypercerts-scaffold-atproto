"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import * as Location from "@/lexicons/types/app/certified/location";
import * as HypercertClaim from "@/lexicons/types/org/hypercerts/claim";
import { createLocation, getHypercert, updateHypercert } from "@/lib/queries";
import { validateHypercert } from "@/lib/utils";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";
import LinkFileSelector from "./link-file-selector";

type LocationContentMode = "link" | "file";

export default function HypercertLocationForm({
  hypercertId,
  onBack,
  onNext,
}: {
  hypercertId: string;
  onBack?: () => void;
  onNext?: () => void;
}) {
  const { atProtoAgent } = useOAuthContext();

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

  const getLocationContent = async () => {
    if (contentMode === "link") {
      if (!locationUrl.trim()) {
        toast.error("Please provide a link to the evidence.");
        setSaving(false);
        return;
      }
      return { $type: "app.certified.defs#uri", value: locationUrl.trim() };
    } else {
      if (!locationFile) {
        toast.error("Please upload an evidence file.");
        setSaving(false);
        return;
      }
      const blob = new Blob([locationFile], { type: locationFile.type });
      const response = await atProtoAgent!.com.atproto.repo.uploadBlob(blob);
      const uploadedBlob = response.data.blob;
      return { $type: "smallBlob", ...uploadedBlob };
    }
  };

  const handleLocationCreation = async () => {
    const location = await getLocationContent();
    if (!location) return;
    const locationRecord: Location.Record = {
      $type: "app.certified.location",
      lpVersion,
      srs,
      locationType: effectiveLocationType,
      location,
      name: name || undefined,
      description: description || undefined,
      createdAt: new Date().toISOString(),
    };

    const validation = Location.validateRecord(locationRecord);
    if (!validation.success) {
      toast.error(validation.error?.message || "Invalid location record");
      setSaving(false);
      return;
    }
    const locationInfo = await createLocation(atProtoAgent!, locationRecord);
    const locationCid = locationInfo?.data?.cid;
    const locationURI = locationInfo?.data?.uri;

    return { locationCid, locationURI };
  };

  const handleUpdateHypercert = async (
    locationCID: string,
    locationURI: string
  ) => {
    if (!atProtoAgent) return;
    const hypercert = await getHypercert(hypercertId, atProtoAgent);
    const hypercertRecord = (hypercert.data.value ||
      {}) as HypercertClaim.Record;
    const updatedHypercert = {
      ...hypercertRecord,
      location: {
        $type: "com.atproto.repo.strongRef" as const,
        cid: locationCID,
        uri: locationURI,
      },
    };

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
      const { locationCid, locationURI } =
        (await handleLocationCreation()) || {};
      if (!locationCid || !locationURI) {
        toast.error("Failed to create location record");
        setSaving(false);
        return;
      }
      await handleUpdateHypercert(locationCid, locationURI);
      toast.success("Location created and linked to hypercert!");
      onNext?.();
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to create location");
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
