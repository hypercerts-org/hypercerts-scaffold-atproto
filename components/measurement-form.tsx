"use client";

import { FormEventHandler, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { Plus, PlusCircle, Trash, Wand2 } from "lucide-react";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";
import UserAvatar from "./user-avatar";
import UserSelection from "./user-selection";
import { CreateHypercertResult } from "@hypercerts-org/sdk-core";
import { useMutation } from "@tanstack/react-query";
import { addMeasurement } from "@/lib/create-actions";
import { toast } from "sonner";

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
  const [measurers, setMeasurers] = useState<ProfileView[]>([]);
  const [manualDids, setManualDids] = useState<string[]>([]);
  const [metric, setMetric] = useState("");
  const [value, setValue] = useState("");

  // Optional fields
  const [useMethod, setUseMethod] = useState(false);
  const [methodUri, setMethodUri] = useState("");

  const [useEvidence, setUseEvidence] = useState(false);
  const [evidenceUris, setEvidenceUris] = useState<string[]>([""]);

  const mutation = useMutation({
    mutationFn: addMeasurement,
    onSuccess: () => {
      toast.success("Measurement added!");
      onNext();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to add measurement.");
    },
  });

  const handleAutofill = () => {
    // Fill manual DIDs
    setManualDids([
      "did:plc:z72i7hdynmk6r22z27h6tvur",
      "did:plc:ragtjsm2j2vknwkz3zp4oxrd",
    ]);

    // Fill metric and value
    setMetric("Trees planted");
    setValue("500");

    // Enable and fill method
    setUseMethod(true);
    setMethodUri("https://example.com/methodology.pdf");

    // Enable and fill evidence
    setUseEvidence(true);
    setEvidenceUris([
      "https://example.com/data.csv",
      "at://did:plc:z72i7hdynmk6r22z27h6tvur/org.hypercerts.claim.evidence/3jzfcijpqzk2a",
    ]);

    toast.success("Form autofilled with dummy data");
  };

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

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!hypercertInfo.hypercertUri) {
      toast.error("Hypercert URI not found");
      return;
    }

    const allMeasurerDids = [
      ...measurers.map((m) => m.did),
      ...manualDids.filter((did) => did.trim() !== ""),
    ];

    mutation.mutate({
      hypercertUri: hypercertInfo.hypercertUri,
      measurers: allMeasurerDids,
      metric,
      value,
      ...(useMethod && { methodUri }),
      ...(useEvidence && {
        evidenceUris: evidenceUris.filter((uri) => uri.trim() !== ""),
      }),
    });
  };

  const hasMeasurers =
    measurers.length > 0 || manualDids.some((did) => did.trim() !== "");

  return (
    <FormInfo
      title="Add Measurement"
      description="Record measurement data related to a hypercert."
    >
      <div className="mb-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAutofill}
          disabled={mutation.isPending}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Autofill with Dummy Data
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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
                        disabled={mutation.isPending}
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
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeManualDid(index)}
                    disabled={manualDids.length === 1 || mutation.isPending}
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
              >
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
            disabled={mutation.isPending}
          />
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
            disabled={mutation.isPending}
          />
        </div>

        {/* Method - Toggle */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={useMethod ? "default" : "outline"}
              size="sm"
              onClick={() => setUseMethod(!useMethod)}
              disabled={mutation.isPending}
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
                <Label htmlFor="method-uri">Method URI</Label>
                <Input
                  id="method-uri"
                  type="text"
                  placeholder="https://example.com/methodology.pdf"
                  value={methodUri}
                  onChange={(e) => setMethodUri(e.target.value)}
                  disabled={mutation.isPending}
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
              disabled={mutation.isPending}
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
              <Label>Evidence URIs</Label>
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
                    disabled={mutation.isPending}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeUriInput(index, evidenceUris, setEvidenceUris)
                    }
                    disabled={evidenceUris.length === 1 || mutation.isPending}
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
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Evidence URI
              </Button>
            </div>
          )}
        </div>
        <FormFooter
          onBack={onBack}
          onSkip={onNext}
          saving={mutation.isPending}
          submitDisabled={
            !hasMeasurers || !metric || !value || mutation.isPending
          }
          submitLabel={"Save & Next"}
          savingLabel={"Saving..."}
        />
      </form>
    </FormInfo>
  );
}
