"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-range-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/lib/api/query-keys";
import { addMeasurement, MeasurementLocationParam } from "@/lib/create-actions";
import { localDateToAtprotoDatetime } from "@/lib/datetime";
import type { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import type { CreateHypercertResult } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Plus,
  PlusCircle,
  Trash,
  Wand2,
  BarChart3,
  Users,
  FlaskConical,
  FileCheck,
} from "lucide-react";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";
import LinkFileSelector from "./link-file-selector";
import UserAvatar from "./user-avatar";
import UserSelection from "./user-selection";

// Location entry type for the form
type LocationEntryMode = "string" | "create";
type LocationTypePreset = "coordinate-decimal" | "geojson-point" | "other";
type LocationContentMode = "link" | "file";

interface LocationEntry {
  id: string;
  mode: LocationEntryMode;
  stringValue: string;
  lpVersion: string;
  srs: string;
  locationType: LocationTypePreset;
  locationTypeCustom: string;
  name: string;
  description: string;
  contentMode: LocationContentMode;
  locationUrl: string;
  locationFile: File | null;
}
interface LocationEntry {
  id: string;
  mode: LocationEntryMode;
  stringValue: string;
  lpVersion: string;
  srs: string;
  locationType: LocationTypePreset;
  locationTypeCustom: string;
  name: string;
  description: string;
  contentMode: LocationContentMode;
  locationUrl: string;
  locationFile: File | null;
}

const createEmptyLocationEntry = (): LocationEntry => ({
  id: crypto.randomUUID(),
  mode: "string",
  stringValue: "",
  lpVersion: "1.0.0",
  srs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
  locationType: "coordinate-decimal",
  locationTypeCustom: "",
  name: "",
  description: "",
  contentMode: "link",
  locationUrl: "",
  locationFile: null,
});

interface MeasurementFormProps {
  hypercertInfo: CreateHypercertResult;
  onNext: () => void;
  onBack: () => void;
}

export default function MeasurementForm({
  hypercertInfo,
  onNext,
  onBack,
}: MeasurementFormProps) {
  const queryClient = useQueryClient();
  const [measurers, setMeasurers] = useState<ProfileView[]>([]);
  const [manualDids, setManualDids] = useState<string[]>([]);
  const [metric, setMetric] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");

  const [useDates, setUseDates] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [useMethod, setUseMethod] = useState(false);
  const [methodType, setMethodType] = useState("");
  const [methodUri, setMethodUri] = useState("");

  const [useEvidence, setUseEvidence] = useState(false);
  const [evidenceUris, setEvidenceUris] = useState<string[]>([""]);

  const [useLocations, setUseLocations] = useState(false);
  const [locationEntries, setLocationEntries] = useState<LocationEntry[]>([]);

  const [useComment, setUseComment] = useState(false);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: addMeasurement,
    onSuccess: () => {
      toast.success("Measurement added!");
      if (hypercertInfo.hypercertUri) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.hypercerts.measurements(
            hypercertInfo.hypercertUri,
          ),
        });
      }
      onNext();
    },
  });

  const handleAutofill = () => {
    setManualDids([
      "did:plc:z72i7hdynmk6r22z27h6tvur",
      "did:plc:ragtjsm2j2vknwkz3zp4oxrd",
    ]);
    setMetric("Trees planted");
    setValue("500");
    setUnit("trees");
    setUseDates(true);
    setStartDate(new Date(2024, 0, 1));
    setEndDate(new Date(2024, 11, 31));
    setUseMethod(true);
    setMethodType("satellite-verification");
    setMethodUri("https://example.com/methodology.pdf");
    setUseEvidence(true);
    setEvidenceUris([
      "https://example.com/data.csv",
      "at://did:plc:z72i7hdynmk6r22z27h6tvur/org.hypercerts.claim.evidence/3jzfcijpqzk2a",
    ]);
    setUseComment(true);
    setComment("Verified via drone imagery and ground survey");
    toast.success("Form autofilled with dummy data");
  };

  const addMeasurer = (user: ProfileView) => {
    if (!measurers.find((m) => m.did === user.did)) {
      setMeasurers((prev) => [...prev, user]);
    }
  };

  const removeMeasurer = (user: ProfileView) => {
    setMeasurers((prev) => prev.filter((m) => m.did !== user.did));
  };

  const addManualDid = () => {
    setManualDids((prev) => [...prev, ""]);
  };

  const removeManualDid = (index: number) => {
    setManualDids((prev) => prev.filter((_, i) => i !== index));
  };

  const updateManualDid = (index: number, value: string) => {
    setManualDids((prev) => {
      const newDids = [...prev];
      newDids[index] = value;
      return newDids;
    });
  };

  const handleUriChange = (
    index: number,
    value: string,
    _uris: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) => {
      const newUris = [...prev];
      newUris[index] = value;
      return newUris;
    });
  };

  const addUriInput = (
    _uris: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) => [...prev, ""]);
  };

  const removeUriInput = (
    index: number,
    _uris: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const buildLocationParams = (): MeasurementLocationParam[] => {
    const result: MeasurementLocationParam[] = [];
    for (const entry of locationEntries) {
      if (entry.mode === "string") {
        const str = entry.stringValue.trim();
        if (str !== "") result.push(str);
      } else {
        const effectiveLocationType =
          entry.locationType === "other"
            ? entry.locationTypeCustom.trim() || "coordinate-decimal"
            : entry.locationType;

        const locationData =
          entry.contentMode === "link"
            ? entry.locationUrl.trim()
            : entry.locationFile;

        if (!locationData) continue;

        result.push({
          lpVersion: entry.lpVersion,
          srs: entry.srs,
          locationType: effectiveLocationType,
          location: locationData,
          ...(entry.name.trim() && { name: entry.name.trim() }),
          ...(entry.description.trim() && {
            description: entry.description.trim(),
          }),
        });
      }
    }
    return result;
  };

  const addLocationEntry = () => {
    setLocationEntries((prev) => [...prev, createEmptyLocationEntry()]);
  };

  const removeLocationEntry = (id: string) => {
    setLocationEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const updateLocationEntry = (id: string, updates: Partial<LocationEntry>) => {
    setLocationEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)),
    );
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!hypercertInfo.hypercertUri) {
      toast.error("Hypercert URI not found");
      return;
    }

    const allMeasurerDids: string[] = [];
    for (const m of measurers) allMeasurerDids.push(m.did);
    for (const did of manualDids) {
      if (did.trim() !== "") allMeasurerDids.push(did);
    }

    const locationParams = useLocations ? buildLocationParams() : [];
    let normalizedStartDate: string | undefined;
    let normalizedEndDate: string | undefined;

    try {
      normalizedStartDate =
        useDates && startDate
          ? localDateToAtprotoDatetime(startDate, "measurement startDate")
          : undefined;
      normalizedEndDate =
        useDates && endDate
          ? localDateToAtprotoDatetime(endDate, "measurement endDate")
          : undefined;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Invalid measurement date: ${message}`);
      return;
    }

    try {
      await mutation.mutateAsync({
        subject: hypercertInfo.hypercertUri,
        metric,
        value,
        unit,
        ...(allMeasurerDids.length > 0 && { measurers: allMeasurerDids }),
        ...(normalizedStartDate ? { startDate: normalizedStartDate } : {}),
        ...(normalizedEndDate ? { endDate: normalizedEndDate } : {}),
        ...(useMethod && methodType && { methodType }),
        ...(useMethod && methodUri && { methodURI: methodUri }),
        ...(useEvidence && {
          evidenceURI: evidenceUris.filter((uri) => uri.trim() !== ""),
        }),
        ...(locationParams.length > 0 && { locations: locationParams }),
        ...(useComment && comment.trim() && { comment: comment.trim() }),
      });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to add measurement: ${message}`);
    }
  };

  return (
    <FormInfo
      stepLabel="Step 4 of 5"
      title="Add Measurement"
      description="Record measurement data related to your hypercert."
    >
      {/* Autofill */}
      <div className="mb-6 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAutofill}
          disabled={mutation.isPending}
          className="gap-2 font-[family-name:var(--font-outfit)] text-xs"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Autofill Demo
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Measurers */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
              <Users className="text-create-accent h-3.5 w-3.5" />
            </div>
            <Label className="text-muted-foreground font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wider uppercase">
              Measurers
            </Label>
            <span className="text-muted-foreground/60 font-[family-name:var(--font-outfit)] text-[11px]">
              Optional
            </span>
          </div>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search Users</TabsTrigger>
              <TabsTrigger value="manual">Add DIDs</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-2">
              <UserSelection onUserSelect={addMeasurer} />
              {measurers.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  {measurers.map((measurer) => (
                    <div
                      key={measurer.did}
                      className="border-border/60 bg-background/50 flex items-center justify-between gap-4 rounded-lg border p-3"
                    >
                      <UserAvatar user={measurer} />
                      <Button
                        onClick={() => removeMeasurer(measurer)}
                        variant="ghost"
                        size="icon"
                        aria-label="Remove measurer"
                        disabled={mutation.isPending}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-2">
              {manualDids.map((did, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="did:plc:xyz123..."
                    value={did}
                    onChange={(e) => updateManualDid(index, e.target.value)}
                    disabled={mutation.isPending}
                    className="font-[family-name:var(--font-outfit)]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeManualDid(index)}
                    disabled={manualDids.length === 1 || mutation.isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addManualDid}
                disabled={mutation.isPending}
                className="gap-2 font-[family-name:var(--font-outfit)]"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add DID
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Metric / Value / Unit */}
        <div className="space-y-4">
          <div className="mb-1 flex items-center gap-2">
            <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
              <BarChart3 className="text-create-accent h-3.5 w-3.5" />
            </div>
            <h3 className="text-muted-foreground font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wider uppercase">
              Measurement Data
            </h3>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="metric"
              className="font-[family-name:var(--font-outfit)] text-sm font-medium"
            >
              Metric *
            </Label>
            <Input
              id="metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              placeholder="e.g., CO2 emissions reduced, trees planted, people trained..."
              maxLength={500}
              required
              disabled={mutation.isPending}
              className="font-[family-name:var(--font-outfit)]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="value"
                className="font-[family-name:var(--font-outfit)] text-sm font-medium"
              >
                Value *
              </Label>
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g., 1000, 500, 250..."
                maxLength={500}
                required
                disabled={mutation.isPending}
                className="font-[family-name:var(--font-outfit)]"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="unit"
                className="font-[family-name:var(--font-outfit)] text-sm font-medium"
              >
                Unit *
              </Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., kg CO2e, hectares, trees, %..."
                maxLength={50}
                required
                disabled={mutation.isPending}
                className="font-[family-name:var(--font-outfit)]"
              />
            </div>
          </div>
        </div>

        {/* Dates Toggle */}
        <div className="space-y-4">
          <Button
            type="button"
            variant={useDates ? "default" : "outline"}
            size="sm"
            onClick={() => setUseDates(!useDates)}
            disabled={mutation.isPending}
            className="gap-2 font-[family-name:var(--font-outfit)]"
          >
            {useDates ? (
              <Trash className="h-3.5 w-3.5" />
            ) : (
              <Calendar className="h-3.5 w-3.5" />
            )}
            {useDates ? "Remove Dates" : "Add Dates"}
          </Button>

          {useDates && (
            <div className="border-create-accent/30 animate-fade-in-up space-y-4 border-l-2 pl-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <DatePicker
                    label="Start Date"
                    initDate={startDate ?? undefined}
                    onChange={(date) => setStartDate(date)}
                  />
                </div>
                <div className="space-y-2">
                  <DatePicker
                    label="End Date"
                    initDate={endDate ?? undefined}
                    onChange={(date) => setEndDate(date)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Method Toggle */}
        <div className="space-y-4">
          <Button
            type="button"
            variant={useMethod ? "default" : "outline"}
            size="sm"
            onClick={() => setUseMethod(!useMethod)}
            disabled={mutation.isPending}
            className="gap-2 font-[family-name:var(--font-outfit)]"
          >
            {useMethod ? (
              <Trash className="h-3.5 w-3.5" />
            ) : (
              <FlaskConical className="h-3.5 w-3.5" />
            )}
            {useMethod ? "Remove Methodology" : "Add Methodology"}
          </Button>

          {useMethod && (
            <div className="border-create-accent/30 animate-fade-in-up space-y-4 border-l-2 pl-4">
              <div className="space-y-2">
                <Label
                  htmlFor="method-type"
                  className="font-[family-name:var(--font-outfit)] text-sm font-medium"
                >
                  Method Type
                </Label>
                <Input
                  id="method-type"
                  type="text"
                  placeholder="e.g., satellite-verification, ground-survey, lab-analysis..."
                  value={methodType}
                  onChange={(e) => setMethodType(e.target.value)}
                  maxLength={30}
                  disabled={mutation.isPending}
                  className="font-[family-name:var(--font-outfit)]"
                />
                <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
                  Short identifier for the measurement methodology (max 30
                  chars)
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="method-uri"
                  className="font-[family-name:var(--font-outfit)] text-sm font-medium"
                >
                  Method URI
                </Label>
                <Input
                  id="method-uri"
                  type="text"
                  placeholder="https://example.com/methodology.pdf"
                  value={methodUri}
                  onChange={(e) => setMethodUri(e.target.value)}
                  disabled={mutation.isPending}
                  className="font-[family-name:var(--font-outfit)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Evidence Toggle */}
        <div className="space-y-4">
          <Button
            type="button"
            variant={useEvidence ? "default" : "outline"}
            size="sm"
            onClick={() => setUseEvidence(!useEvidence)}
            disabled={mutation.isPending}
            className="gap-2 font-[family-name:var(--font-outfit)]"
          >
            {useEvidence ? (
              <Trash className="h-3.5 w-3.5" />
            ) : (
              <FileCheck className="h-3.5 w-3.5" />
            )}
            {useEvidence ? "Remove Evidence" : "Add Evidence"}
          </Button>

          {useEvidence && (
            <div className="border-create-accent/30 animate-fade-in-up space-y-2 border-l-2 pl-4">
              <Label className="font-[family-name:var(--font-outfit)] text-sm font-medium">
                Evidence URIs
              </Label>
              {evidenceUris.map((uri, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="https://example.com/data.csv or at://did:plc:..."
                    value={uri}
                    onChange={(e) =>
                      handleUriChange(
                        index,
                        e.target.value,
                        evidenceUris,
                        setEvidenceUris,
                      )
                    }
                    disabled={mutation.isPending}
                    className="font-[family-name:var(--font-outfit)]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeUriInput(index, evidenceUris, setEvidenceUris)
                    }
                    disabled={evidenceUris.length === 1 || mutation.isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addUriInput(evidenceUris, setEvidenceUris)}
                disabled={mutation.isPending}
                className="gap-2 font-[family-name:var(--font-outfit)]"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Evidence URI
              </Button>
            </div>
          )}
        </div>

        {/* Locations Section */}
        <div className="border-border/50 space-y-5 border-t pt-6">
          <div className="flex items-center gap-2">
            <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
              <MapPin className="text-create-accent h-3.5 w-3.5" />
            </div>
            <h3 className="text-muted-foreground font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wider uppercase">
              Locations
            </h3>
            <span className="text-muted-foreground/60 font-[family-name:var(--font-outfit)] text-[11px]">
              Optional
            </span>
          </div>

          <Button
            type="button"
            variant={useLocations ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setUseLocations(!useLocations);
              if (!useLocations && locationEntries.length === 0) {
                setLocationEntries([createEmptyLocationEntry()]);
              }
            }}
            disabled={mutation.isPending}
            className="gap-2 font-[family-name:var(--font-outfit)]"
          >
            {useLocations ? (
              <Trash className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {useLocations ? "Remove Locations" : "Add Locations"}
          </Button>

          {useLocations && (
            <div className="animate-fade-in-up space-y-6">
              {locationEntries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="border-border/60 bg-muted/20 space-y-4 rounded-xl border p-5"
                >
                  <div className="flex items-center justify-between">
                    <Label className="font-[family-name:var(--font-outfit)] text-sm font-semibold">
                      Location {idx + 1}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLocationEntry(entry.id)}
                      disabled={
                        locationEntries.length === 1 || mutation.isPending
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mode selector */}
                  <div className="space-y-2">
                    <Label className="font-[family-name:var(--font-outfit)] text-sm font-medium">
                      Location Mode
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          entry.mode === "string" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updateLocationEntry(entry.id, { mode: "string" })
                        }
                        disabled={mutation.isPending}
                        className="font-[family-name:var(--font-outfit)]"
                      >
                        Reference (AT-URI)
                      </Button>
                      <Button
                        type="button"
                        variant={
                          entry.mode === "create" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updateLocationEntry(entry.id, { mode: "create" })
                        }
                        disabled={mutation.isPending}
                        className="font-[family-name:var(--font-outfit)]"
                      >
                        Create New Location
                      </Button>
                    </div>
                  </div>

                  {entry.mode === "string" ? (
                    <div className="space-y-2">
                      <Label className="font-[family-name:var(--font-outfit)] text-sm font-medium">
                        Location Reference
                      </Label>
                      <Input
                        type="text"
                        placeholder="at://did:plc:xxx/app.certified.location/xxx or simple string"
                        value={entry.stringValue}
                        onChange={(e) =>
                          updateLocationEntry(entry.id, {
                            stringValue: e.target.value,
                          })
                        }
                        disabled={mutation.isPending}
                        className="font-[family-name:var(--font-outfit)]"
                      />
                      <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
                        Enter an AT-URI to an existing location record or a
                        simple string identifier
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="font-[family-name:var(--font-outfit)] text-sm font-medium">
                            Location Protocol Version *
                          </Label>
                          <Input
                            value={entry.lpVersion}
                            onChange={(e) =>
                              updateLocationEntry(entry.id, {
                                lpVersion: e.target.value,
                              })
                            }
                            disabled={mutation.isPending}
                            className="font-[family-name:var(--font-outfit)]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-[family-name:var(--font-outfit)] text-sm font-medium">
                            Spatial Reference System (SRS) *
                          </Label>
                          <Input
                            value={entry.srs}
                            onChange={(e) =>
                              updateLocationEntry(entry.id, {
                                srs: e.target.value,
                              })
                            }
                            disabled={mutation.isPending}
                            className="font-[family-name:var(--font-outfit)]"
                          />
                          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
                            e.g., http://www.opengis.net/def/crs/OGC/1.3/CRS84
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-[family-name:var(--font-outfit)] text-sm font-medium">
                          Location Type *
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={
                              entry.locationType === "coordinate-decimal"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              updateLocationEntry(entry.id, {
                                locationType: "coordinate-decimal",
                              })
                            }
                            disabled={mutation.isPending}
                            className="font-[family-name:var(--font-outfit)]"
                          >
                            coordinate-decimal
                          </Button>
                          <Button
                            type="button"
                            variant={
                              entry.locationType === "geojson-point"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              updateLocationEntry(entry.id, {
                                locationType: "geojson-point",
                              })
                            }
                            disabled={mutation.isPending}
                            className="font-[family-name:var(--font-outfit)]"
                          >
                            geojson-point
                          </Button>
                          <Button
                            type="button"
                            variant={
                              entry.locationType === "other"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              updateLocationEntry(entry.id, {
                                locationType: "other",
                              })
                            }
                            disabled={mutation.isPending}
                            className="font-[family-name:var(--font-outfit)]"
                          >
                            Other
                          </Button>
                        </div>
                        {entry.locationType === "other" && (
                          <Input
                            placeholder="Custom locationType identifier"
                            value={entry.locationTypeCustom}
                            onChange={(e) =>
                              updateLocationEntry(entry.id, {
                                locationTypeCustom: e.target.value,
                              })
                            }
                            className="mt-2 font-[family-name:var(--font-outfit)]"
                            disabled={mutation.isPending}
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="font-[family-name:var(--font-outfit)] text-sm font-medium">
                          Location Name (Optional)
                        </Label>
                        <Input
                          placeholder="e.g., Kathmandu Office, Field Site A"
                          value={entry.name}
                          onChange={(e) =>
                            updateLocationEntry(entry.id, {
                              name: e.target.value,
                            })
                          }
                          maxLength={256}
                          disabled={mutation.isPending}
                          className="font-[family-name:var(--font-outfit)]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-[family-name:var(--font-outfit)] text-sm font-medium">
                          Location Description (Optional)
                        </Label>
                        <Textarea
                          placeholder="Describe the location, region coverage, or context..."
                          value={entry.description}
                          onChange={(e) =>
                            updateLocationEntry(entry.id, {
                              description: e.target.value,
                            })
                          }
                          rows={2}
                          disabled={mutation.isPending}
                          className="font-[family-name:var(--font-outfit)]"
                        />
                      </div>

                      <LinkFileSelector
                        label="Location Data *"
                        fileUploadDisabled={false}
                        mode={entry.contentMode}
                        onModeChange={(mode) =>
                          updateLocationEntry(entry.id, {
                            contentMode: mode as LocationContentMode,
                          })
                        }
                        urlPlaceholder="https://example.com/location.json"
                        onUrlChange={(url) =>
                          updateLocationEntry(entry.id, { locationUrl: url })
                        }
                        onFileChange={(e) =>
                          updateLocationEntry(entry.id, {
                            locationFile: e.target.files?.[0] ?? null,
                          })
                        }
                        required
                        urlHelpText="Link to a resource encoding the location (e.g., GeoJSON point, CSV with coordinates)."
                        fileHelpText="Upload a file that contains location data. It will be stored as a blob."
                        accept=".geojson,application/geo+json,application/json"
                      />
                    </div>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLocationEntry}
                disabled={mutation.isPending}
                className="gap-2 font-[family-name:var(--font-outfit)]"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Another Location
              </Button>
            </div>
          )}
        </div>

        {/* Comment Toggle */}
        <div className="space-y-4">
          <Button
            type="button"
            variant={useComment ? "default" : "outline"}
            size="sm"
            onClick={() => setUseComment(!useComment)}
            disabled={mutation.isPending}
            className="gap-2 font-[family-name:var(--font-outfit)]"
          >
            {useComment ? (
              <Trash className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {useComment ? "Remove Comment" : "Add Comment"}
          </Button>

          {useComment && (
            <div className="border-create-accent/30 animate-fade-in-up space-y-2 border-l-2 pl-4">
              <Label
                htmlFor="comment"
                className="font-[family-name:var(--font-outfit)] text-sm font-medium"
              >
                Comment
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Additional notes or annotations about this measurement..."
                maxLength={300}
                rows={3}
                disabled={mutation.isPending}
                className="font-[family-name:var(--font-outfit)]"
              />
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
                {comment.length} / 300 characters
              </p>
            </div>
          )}
        </div>

        <FormFooter
          onBack={onBack}
          onSkip={onNext}
          saving={mutation.isPending}
          submitDisabled={!metric || !value || !unit || mutation.isPending}
          submitLabel={"Save & Next"}
          savingLabel={"Saving..."}
        />
      </form>
    </FormInfo>
  );
}
