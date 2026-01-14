"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { Plus, PlusCircle, Trash } from "lucide-react";
import { useState } from "react";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";
import UserAvatar from "./user-avatar";
import UserSelection from "./user-selection";

interface MeasurementFormProps {
  onNext: () => void;
  onBack: () => void;
}

export default function MeasurementForm({
  onNext,
  onBack,
}: MeasurementFormProps) {
  const [measurers, setMeasurers] = useState<ProfileView[]>([]);
  const [manualDids, setManualDids] = useState<string[]>([]);
  const [metric, setMetric] = useState("");
  const [value, setValue] = useState("");

  // Optional fields
  const [useSubject, setUseSubject] = useState(false);
  const [subjectUri, setSubjectUri] = useState("");
  const [subjectCid, setSubjectCid] = useState("");

  const [useMethod, setUseMethod] = useState(false);
  const [methodType, setMethodType] = useState("");
  const [methodUri, setMethodUri] = useState("");

  const [useEvidence, setUseEvidence] = useState(false);
  const [evidenceUris, setEvidenceUris] = useState<string[]>([""]);

  const [useLocation, setUseLocation] = useState(false);
  const [locationUri, setLocationUri] = useState("");
  const [locationCid, setLocationCid] = useState("");

  const addMeasurer = (user: ProfileView) => {
    if (!measurers.find((m) => m.did === user.did)) {
      setMeasurers((prev) => [...prev, user]);
    }
  };

  const removeMeasurer = (user: ProfileView) => {
    setMeasurers(measurers.filter((m) => m.did !== user.did));
  };

  const addManualDid = () => {
    setManualDids([...manualDids, ""]);
  };

  const removeManualDid = (index: number) => {
    setManualDids(manualDids.filter((_, i) => i !== index));
  };

  const updateManualDid = (index: number, value: string) => {
    const newDids = [...manualDids];
    newDids[index] = value;
    setManualDids(newDids);
  };

  const handleUriChange = (
    index: number,
    value: string,
    uris: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newUris = [...uris];
    newUris[index] = value;
    setter(newUris);
  };

  const addUriInput = (
    uris: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter([...uris, ""]);
  };

  const removeUriInput = (
    index: number,
    uris: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newUris = uris.filter((_, i) => i !== index);
    setter(newUris);
  };

  const handleSubmit = () => {
    const allMeasurerDids = [
      ...measurers.map((m) => m.did),
      ...manualDids.filter((did) => did.trim() !== ""),
    ];

    console.log({
      measurers: allMeasurerDids,
      metric,
      value,
      ...(useSubject &&
        subjectUri &&
        subjectCid && {
          subject: { uri: subjectUri, cid: subjectCid },
        }),
      ...(useMethod && {
        ...(methodType && { methodType }),
        ...(methodUri && { methodURI: methodUri }),
      }),
      ...(useEvidence && {
        evidenceURI: evidenceUris.filter((uri) => uri.trim() !== ""),
      }),
      ...(useLocation &&
        locationUri &&
        locationCid && {
          location: { uri: locationUri, cid: locationCid },
        }),
      createdAt: new Date().toISOString(),
    });
    onNext();
  };

  const hasMeasurers =
    measurers.length > 0 || manualDids.some((did) => did.trim() !== "");

  return (
    <FormInfo
      title="Add Measurement"
      description="Record measurement data related to a hypercert."
    >
      <div className="space-y-8">
        {/* Measurers */}
        <div className="space-y-2">
          <Label>Measurers *</Label>
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
                      className="flex justify-between items-center gap-4 border p-2 rounded-md"
                    >
                      <UserAvatar user={measurer} />
                      <Button
                        onClick={() => removeMeasurer(measurer)}
                        variant="outline"
                        size="icon"
                        aria-label="Remove measurer"
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
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeManualDid(index)}
                    disabled={manualDids.length === 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addManualDid}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add DID
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Metric */}
        <div className="space-y-2">
          <Label htmlFor="metric">Metric *</Label>
          <Input
            id="metric"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            placeholder="e.g., CO2 emissions reduced, trees planted, people trained..."
            maxLength={500}
            required
          />
          <p className="text-xs text-muted-foreground">
            {metric.length} / 500 characters
          </p>
        </div>

        {/* Value */}
        <div className="space-y-2">
          <Label htmlFor="value">Value *</Label>
          <Input
            id="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g., 1000 tons, 500 trees, 250 participants..."
            maxLength={500}
            required
          />
          <p className="text-xs text-muted-foreground">
            {value.length} / 500 characters
          </p>
        </div>

        {/* Method - Toggle */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={useMethod ? "default" : "outline"}
              size="sm"
              onClick={() => setUseMethod(!useMethod)}
            >
              {useMethod ? (
                <Trash className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {useMethod ? "Remove Methodology" : "Add Methodology"}
            </Button>
          </div>

          {useMethod && (
            <div className="space-y-4 pl-4 border-l-2">
              <div className="space-y-2">
                <Label htmlFor="method-type">Method Type</Label>
                <Input
                  id="method-type"
                  type="text"
                  placeholder="e.g., ISO-14064, GHG-Protocol, Direct-Count..."
                  value={methodType}
                  onChange={(e) => setMethodType(e.target.value)}
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">
                  {methodType.length} / 30 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method-uri">Method URI</Label>
                <Input
                  id="method-uri"
                  type="text"
                  placeholder="https://example.com/methodology.pdf"
                  value={methodUri}
                  onChange={(e) => setMethodUri(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Evidence URIs - Toggle */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={useEvidence ? "default" : "outline"}
              size="sm"
              onClick={() => setUseEvidence(!useEvidence)}
            >
              {useEvidence ? (
                <Trash className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {useEvidence ? "Remove Evidence" : "Add Evidence"}
            </Button>
          </div>

          {useEvidence && (
            <div className="space-y-2 pl-4 border-l-2">
              <Label>Evidence URIs (max 50)</Label>
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
                        setEvidenceUris
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeUriInput(index, evidenceUris, setEvidenceUris)
                    }
                    disabled={evidenceUris.length === 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {evidenceUris.length < 50 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addUriInput(evidenceUris, setEvidenceUris)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Evidence URI
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Location Reference - Toggle */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={useLocation ? "default" : "outline"}
              size="sm"
              onClick={() => setUseLocation(!useLocation)}
            >
              {useLocation ? (
                <Trash className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {useLocation ? "Remove Location" : "Add Location"}
            </Button>
          </div>

          {useLocation && (
            <div className="space-y-4 pl-4 border-l-2">
              <Label>Location Reference</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label
                    htmlFor="location-uri"
                    className="text-xs text-muted-foreground"
                  >
                    URI
                  </Label>
                  <Input
                    id="location-uri"
                    type="text"
                    value={locationUri}
                    onChange={(e) => setLocationUri(e.target.value)}
                    placeholder="at://did:plc:..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <FormFooter
        onBack={onBack}
        onSkip={onNext}
        saving={false}
        submitLabel={"Save & Next"}
        savingLabel={""}
      />
    </FormInfo>
  );
}
