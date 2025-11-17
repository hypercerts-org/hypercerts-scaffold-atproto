"use client";

import { FormEventHandler, useState } from "react";
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
import * as Location from "@/lexicons/types/app/certified/location";
import { HypercertRecordData } from "@/lib/types";
import { validateHypercert } from "@/lib/utils";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ArrowLeft, Link as LinkIcon, Upload } from "lucide-react";
import { toast } from "sonner";

type LocationContentMode = "link" | "file";

export default function HypercertLocationForm({
  hypercertId,
  hypercertData,
  onBack,
  onNext,
}: {
  hypercertId: string;
  hypercertData?: HypercertRecordData;
  onBack?: () => void;
  onNext?: () => void;
}) {
  const { atProtoAgent } = useOAuthContext();
  const hypercertRecord = hypercertData?.value;

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
    if (!atProtoAgent) return;
    if (!hypercertRecord) {
      toast.error("Hypercert data not loaded");
      return;
    }

    try {
      setSaving(true);

      let locationValue: Location.Record["location"];

      if (contentMode === "link") {
        if (!locationUrl.trim()) {
          toast.error("Please provide a link (URI) for the location.");
          setSaving(false);
          return;
        }
        locationValue = {
          $type: "app.certified.defs#uri",
          value: locationUrl.trim(),
        };
      } else {
        if (!locationFile) {
          toast.error("Please upload a file containing location data.");
          setSaving(false);
          return;
        }
        const blob = new Blob([locationFile], { type: locationFile.type });
        const response = await atProtoAgent.com.atproto.repo.uploadBlob(blob);
        const uploadedBlob = response.data.blob;

        locationValue = { $type: "smallBlob", ...uploadedBlob };
      }

      const locationRecord: Location.Record = {
        $type: "app.certified.location",
        lpVersion,
        srs,
        locationType: effectiveLocationType,
        location: locationValue,
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

      const createResponse = await atProtoAgent.com.atproto.repo.createRecord({
        rkey: String(Date.now()),
        record: locationRecord,
        collection: "app.certified.location",
        repo: atProtoAgent.assertDid,
      });

      const locationCid = createResponse?.data?.cid;
      const locationURI = createResponse?.data?.uri;
      if (!locationCid || !locationURI) {
        toast.error("Failed to create location record");
        setSaving(false);
        return;
      }

      // Assumes hypercert has a `locations` field similar to `contributions`.
      // For now, keep it to a single location.
      const updatedHypercert = {
        ...hypercertRecord,
        locations: [
          {
            $type: "com.atproto.repo.strongRef",
            cid: locationCid,
            uri: locationURI,
          },
        ],
      };

      const hypercertValidation = validateHypercert(updatedHypercert);
      if (!hypercertValidation.success) {
        toast.error(
          hypercertValidation.error || "Invalid updated hypercert record"
        );
        setSaving(false);
        return;
      }

      await atProtoAgent.com.atproto.repo.putRecord({
        rkey: hypercertId,
        repo: atProtoAgent.assertDid,
        collection: "org.hypercerts.claim",
        record: updatedHypercert,
      });

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
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                {/* You can prepend "Step X of Y ·" here if you want */}
                <CardTitle className="text-2xl">
                  Add Hypercert Location
                </CardTitle>
                <CardDescription className="mt-1">
                  Define the spatial context for this hypercert claim using a
                  URI or uploaded location file.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
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
                  <Label htmlFor="srs">
                    Spatial Reference System (SRS) URI *
                  </Label>
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
                      locationTypePreset === "geojson-point"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setLocationTypePreset("geojson-point")}
                  >
                    geojson-point
                  </Button>
                  <Button
                    type="button"
                    variant={
                      locationTypePreset === "other" ? "default" : "outline"
                    }
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
                <Label htmlFor="description">
                  Location Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the location, region coverage, or context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label>Location Data *</Label>

                <div className="inline-flex rounded-md border divide-x overflow-hidden">
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm ${
                      contentMode === "link"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background"
                    }`}
                    onClick={() => setContentMode("link")}
                  >
                    <LinkIcon className="h-4 w-4" />
                    Link
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm ${
                      contentMode === "file"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background"
                    }`}
                    onClick={() => setContentMode("file")}
                  >
                    <Upload className="h-4 w-4" />
                    File
                  </button>
                </div>

                {contentMode === "link" ? (
                  <div className="space-y-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/location.json"
                      onChange={(e) => setLocationUrl(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Link to a resource encoding the location (e.g., GeoJSON
                      point, CSV with coordinates).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input type="file" onChange={handleFileChange} required />
                    <p className="text-xs text-muted-foreground">
                      Upload a file that contains location data. It will be
                      stored as a blob.
                    </p>
                  </div>
                )}
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

                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-[180px]"
                >
                  {saving ? "Saving…" : "Save Location"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
