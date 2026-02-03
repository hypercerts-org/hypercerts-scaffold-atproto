"use client";

import { FormEventHandler, useState } from "react";
import type { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash, PlusCircle, Plus, Wand2, MapPin } from "lucide-react";
import UserSelection from "./user-selection";
import UserAvatar from "./user-avatar";
import FormInfo from "./form-info";
import FormFooter from "./form-footer";
import type { CreateHypercertResult } from "@hypercerts-org/sdk-core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/api/query-keys";
import { addEvaluation } from "@/lib/create-actions";

interface EvaluationFormProps {
  hypercertInfo: CreateHypercertResult;
  onNext: () => void;
  onBack: () => void;
}

export default function EvaluationForm({
  hypercertInfo,
  onNext,
  onBack,
}: EvaluationFormProps) {
  const queryClient = useQueryClient();
  const [evaluators, setEvaluators] = useState<ProfileView[]>([]);
  const [manualDids, setManualDids] = useState<string[]>([]);
  const [summary, setSummary] = useState("");

  // Optional fields
  const [useScore, setUseScore] = useState(false);
  const [scoreMin, setScoreMin] = useState<number>(0);
  const [scoreMax, setScoreMax] = useState<number>(10);
  const [scoreValue, setScoreValue] = useState<number>(5);

  const [useContent, setUseContent] = useState(false);
  const [contentUris, setContentUris] = useState<string[]>([""]);

  const [useMeasurements, setUseMeasurements] = useState(false);
  const [measurementUris, setMeasurementUris] = useState<string[]>([""]);

  const [useLocation, setUseLocation] = useState(false);
  const [locationUri, setLocationUri] = useState("");

  const mutation = useMutation({
    mutationFn: addEvaluation,
    onSuccess: () => {
      toast.success("Evaluation added!");
      if (hypercertInfo.hypercertUri) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.hypercerts.evaluations(hypercertInfo.hypercertUri),
        });
      }
      onNext();
    },
    onError: (error) => {
      console.error("Failed to add evaluation:", error);
      toast.error("Failed to add evaluation");
    },
  });

  const handleAutofill = () => {
    // Fill manual DIDs
    setManualDids([
      "did:plc:z72i7hdynmk6r22z27h6tvur",
      "did:plc:ragtjsm2j2vknwkz3zp4oxrd",
    ]);

    // Fill summary
    setSummary(
      "This evaluation assesses the significant environmental impact of the reforestation project. " +
        "The project successfully planted 5,000 native trees across 25 hectares of degraded land, " +
        "contributing to carbon sequestration and biodiversity restoration. Independent verification " +
        "confirmed a 95% survival rate after 6 months. The project engaged local communities through " +
        "educational workshops and created sustainable employment opportunities. Impact metrics show " +
        "an estimated 125 tons of CO2 will be sequestered annually once trees reach maturity."
    );

    // Enable and fill score
    setUseScore(true);
    setScoreMin(1);
    setScoreMax(10);
    setScoreValue(8);

    // Enable and fill content URIs
    setUseContent(true);
    setContentUris([
      "https://example.com/evaluation-report.pdf",
      "https://example.com/field-verification-photos.zip",
    ]);

    // Enable and fill measurement URIs
    setUseMeasurements(true);
    setMeasurementUris([
      "at://did:plc:z72i7hdynmk6r22z27h6tvur/org.hypercerts.claim.measurement/3jzfcijpqzk2a",
      "at://did:plc:z72i7hdynmk6r22z27h6tvur/org.hypercerts.claim.measurement/3jzfcijpqzk2b",
    ]);

    // Enable and fill location
    setUseLocation(true);
    setLocationUri(
      "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.certified.location/3jzfcijpqzk2c"
    );

    toast.success("Form autofilled with dummy data");
  };

  const addEvaluator = (user: ProfileView) => {
    if (!evaluators.find((e) => e.did === user.did)) {
      setEvaluators((prev) => [...prev, user]);
    }
  };

  const removeEvaluator = (user: ProfileView) => {
    setEvaluators((prev) => prev.filter((e) => e.did !== user.did));
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
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => {
      const newUris = [...prev];
      newUris[index] = value;
      return newUris;
    });
  };

  const addUriInput = (
    _uris: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => [...prev, ""]);
  };

  const removeUriInput = (
    index: number,
    _uris: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!hypercertInfo?.hypercertUri) {
      toast.error("Hypercert URI not found.");
      return;
    }

    const allEvaluatorDids = [
      ...evaluators.map((e) => e.did),
      ...manualDids.filter((did) => did.trim() !== ""),
    ];

    const evaluationPayload = {
      hypercertUri: hypercertInfo.hypercertUri,
      evaluators: allEvaluatorDids,
      summary,
      ...(useScore && {
        score: { min: scoreMin, max: scoreMax, value: scoreValue },
      }),
      ...(useContent && {
        content: contentUris.filter((uri) => uri.trim() !== ""),
      }),
      ...(useMeasurements && {
        measurements: measurementUris.filter((uri) => uri.trim() !== ""),
      }),
      ...(useLocation && locationUri && { location: locationUri }),
    };

    mutation.mutate(evaluationPayload);
  };

  const hasEvaluators =
    evaluators.length > 0 || manualDids.some((did) => did.trim() !== "");

  return (
    <FormInfo
      title="Add Evaluation"
      description="Provide an evaluation of the hypercert's impact."
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
        {/* Evaluators */}
        <div className="space-y-2">
          <Label>Evaluators *</Label>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search Users</TabsTrigger>
              <TabsTrigger value="manual">Add DIDs</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-2">
              <UserSelection onUserSelect={addEvaluator} />
              {evaluators.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  {evaluators.map((evaluator) => (
                    <div
                      key={evaluator.did}
                      className="flex justify-between items-center gap-4 border p-2 rounded-md"
                    >
                      <UserAvatar user={evaluator} />
                      <Button
                        onClick={() => removeEvaluator(evaluator)}
                        variant="outline"
                        size="icon"
                        aria-label="Remove evaluator"
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

        {/* Summary */}
        <div className="space-y-2">
          <Label htmlFor="summary">Summary *</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="A brief evaluation summary..."
            maxLength={5000}
            rows={5}
            required
            disabled={mutation.isPending}
          />
        </div>

        {/* Score - Toggle */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={useScore ? "default" : "outline"}
              size="sm"
              onClick={() => setUseScore(!useScore)}
              disabled={mutation.isPending}
            >
              {useScore ? (
                <Trash className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {useScore ? "Remove Score" : "Add Score"}
            </Button>
          </div>

          {useScore && (
            <div className="space-y-4 pl-4 border-l-2">
              <Label>Numeric Score</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label
                    htmlFor="score-min"
                    className="text-xs text-muted-foreground"
                  >
                    Min
                  </Label>
                  <Input
                    id="score-min"
                    type="number"
                    value={scoreMin}
                    onChange={(e) => setScoreMin(parseInt(e.target.value) || 0)}
                    disabled={mutation.isPending}
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="score-value"
                    className="text-xs text-muted-foreground"
                  >
                    Value
                  </Label>
                  <Input
                    id="score-value"
                    type="number"
                    value={scoreValue}
                    onChange={(e) =>
                      setScoreValue(parseInt(e.target.value) || 0)
                    }
                    disabled={mutation.isPending}
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="score-max"
                    className="text-xs text-muted-foreground"
                  >
                    Max
                  </Label>
                  <Input
                    id="score-max"
                    type="number"
                    value={scoreMax}
                    onChange={(e) => setScoreMax(parseInt(e.target.value) || 0)}
                    disabled={mutation.isPending}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content URIs - Toggle */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={useContent ? "default" : "outline"}
              size="sm"
              onClick={() => setUseContent(!useContent)}
              disabled={mutation.isPending}
            >
              {useContent ? (
                <Trash className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {useContent ? "Remove Content" : "Add Content"}
            </Button>
          </div>

          {useContent && (
            <div className="space-y-2 pl-4 border-l-2">
              <Label>Content URIs</Label>
              {contentUris.map((uri, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="https://example.com/report.pdf"
                    value={uri}
                    onChange={(e) =>
                      handleUriChange(
                        index,
                        e.target.value,
                        contentUris,
                        setContentUris
                      )
                    }
                    disabled={mutation.isPending}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeUriInput(index, contentUris, setContentUris)
                    }
                    disabled={contentUris.length === 1 || mutation.isPending}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addUriInput(contentUris, setContentUris)}
                disabled={mutation.isPending}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Content URI
              </Button>
            </div>
          )}
        </div>

        {/* Measurement URIs - Toggle */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={useMeasurements ? "default" : "outline"}
              size="sm"
              onClick={() => setUseMeasurements(!useMeasurements)}
              disabled={mutation.isPending}
            >
              {useMeasurements ? (
                <Trash className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {useMeasurements ? "Remove Measurements" : "Add Measurements"}
            </Button>
          </div>

          {useMeasurements && (
            <div className="space-y-2 pl-4 border-l-2">
              <Label>Measurement URIs</Label>
              {measurementUris.map((uri, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="at://did:plc:xxx/org.hypercerts.claim.measurement/xxx"
                    value={uri}
                    onChange={(e) =>
                      handleUriChange(
                        index,
                        e.target.value,
                        measurementUris,
                        setMeasurementUris
                      )
                    }
                    disabled={mutation.isPending}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeUriInput(index, measurementUris, setMeasurementUris)
                    }
                    disabled={
                      measurementUris.length === 1 || mutation.isPending
                    }
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addUriInput(measurementUris, setMeasurementUris)}
                disabled={mutation.isPending}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Measurement URI
              </Button>
            </div>
          )}
        </div>

        {/* Location Section */}
        <div className="space-y-6 pt-6 border-t">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Location (Optional)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Add geographic location information for this evaluation
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={useLocation ? "default" : "outline"}
              size="sm"
              onClick={() => setUseLocation(!useLocation)}
              disabled={mutation.isPending}
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
            <div className="space-y-2">
              <Label htmlFor="location">Location URI</Label>
              <Input
                id="location"
                value={locationUri}
                onChange={(e) => setLocationUri(e.target.value)}
                placeholder="at://did:plc:xxx/app.certified.location/xxx"
                disabled={mutation.isPending}
              />
            </div>
          )}
        </div>
        <FormFooter
          onBack={onBack}
          onSkip={onNext}
          submitLabel="Save & Next"
          savingLabel="Saving…"
          saving={mutation.isPending}
          submitDisabled={mutation.isPending || !hasEvaluators || !summary}
        />
      </form>
    </FormInfo>
  );
}
