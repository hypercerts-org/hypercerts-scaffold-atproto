"use client";

import { FormEventHandler, useState } from "react";
import type { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash,
  PlusCircle,
  Plus,
  Wand2,
  MapPin,
  Users,
  ClipboardCheck,
  BarChart3,
  FileCheck,
  Hash,
} from "lucide-react";
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
          queryKey: queryKeys.hypercerts.evaluations(
            hypercertInfo.hypercertUri,
          ),
        });
      }
      onNext();
    },
    onError: (error) => {
      console.error("Failed to add evaluation:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to add evaluation: ${message}`);
    },
  });

  const handleAutofill = () => {
    setManualDids([
      "did:plc:z72i7hdynmk6r22z27h6tvur",
      "did:plc:ragtjsm2j2vknwkz3zp4oxrd",
    ]);
    setSummary(
      "This evaluation assesses the significant environmental impact of the reforestation project. " +
        "The project successfully planted 5,000 native trees across 25 hectares of degraded land, " +
        "contributing to carbon sequestration and biodiversity restoration. Independent verification " +
        "confirmed a 95% survival rate after 6 months. The project engaged local communities through " +
        "educational workshops and created sustainable employment opportunities. Impact metrics show " +
        "an estimated 125 tons of CO2 will be sequestered annually once trees reach maturity.",
    );
    setUseScore(true);
    setScoreMin(1);
    setScoreMax(10);
    setScoreValue(8);
    setUseContent(true);
    setContentUris([
      "https://example.com/evaluation-report.pdf",
      "https://example.com/field-verification-photos.zip",
    ]);
    setUseMeasurements(true);
    setMeasurementUris([
      "at://did:plc:z72i7hdynmk6r22z27h6tvur/org.hypercerts.claim.measurement/3jzfcijpqzk2a",
      "at://did:plc:z72i7hdynmk6r22z27h6tvur/org.hypercerts.claim.measurement/3jzfcijpqzk2b",
    ]);
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
      stepLabel="Step 5 of 5"
      title="Add Evaluation"
      description="Provide an evaluation of the hypercert's impact."
    >
      {/* Autofill */}
      <div className="flex justify-end mb-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAutofill}
          disabled={mutation.isPending}
          className="gap-2 text-xs font-[family-name:var(--font-outfit)]"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Autofill Demo
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Evaluators */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-create-accent/10 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-create-accent" />
            </div>
            <Label className="text-sm font-[family-name:var(--font-syne)] font-semibold uppercase tracking-wider text-muted-foreground">
              Evaluators *
            </Label>
          </div>
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
                      className="flex justify-between items-center gap-4 border border-border/60 p-3 rounded-lg bg-background/50"
                    >
                      <UserAvatar user={evaluator} />
                      <Button
                        onClick={() => removeEvaluator(evaluator)}
                        variant="ghost"
                        size="icon"
                        aria-label="Remove evaluator"
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

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg bg-create-accent/10 flex items-center justify-center">
              <ClipboardCheck className="h-3.5 w-3.5 text-create-accent" />
            </div>
            <Label
              htmlFor="summary"
              className="text-sm font-[family-name:var(--font-syne)] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Summary *
            </Label>
          </div>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="A brief evaluation summary..."
            maxLength={5000}
            rows={5}
            required
            disabled={mutation.isPending}
            className="font-[family-name:var(--font-outfit)]"
          />
        </div>

        {/* Score Toggle */}
        <div className="space-y-4">
          <Button
            type="button"
            variant={useScore ? "default" : "outline"}
            size="sm"
            onClick={() => setUseScore(!useScore)}
            disabled={mutation.isPending}
            className="gap-2 font-[family-name:var(--font-outfit)]"
          >
            {useScore ? (
              <Trash className="h-3.5 w-3.5" />
            ) : (
              <Hash className="h-3.5 w-3.5" />
            )}
            {useScore ? "Remove Score" : "Add Score"}
          </Button>

          {useScore && (
            <div className="space-y-4 pl-4 border-l-2 border-create-accent/30 animate-fade-in-up">
              <Label className="text-sm font-[family-name:var(--font-outfit)] font-medium">
                Numeric Score
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label
                    htmlFor="score-min"
                    className="text-[11px] font-[family-name:var(--font-outfit)] text-muted-foreground"
                  >
                    Min
                  </Label>
                  <Input
                    id="score-min"
                    type="number"
                    value={scoreMin}
                    onChange={(e) => setScoreMin(parseInt(e.target.value) || 0)}
                    disabled={mutation.isPending}
                    className="font-[family-name:var(--font-outfit)]"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="score-value"
                    className="text-[11px] font-[family-name:var(--font-outfit)] text-muted-foreground"
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
                    className="font-[family-name:var(--font-outfit)]"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="score-max"
                    className="text-[11px] font-[family-name:var(--font-outfit)] text-muted-foreground"
                  >
                    Max
                  </Label>
                  <Input
                    id="score-max"
                    type="number"
                    value={scoreMax}
                    onChange={(e) => setScoreMax(parseInt(e.target.value) || 0)}
                    disabled={mutation.isPending}
                    className="font-[family-name:var(--font-outfit)]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content URIs Toggle */}
        <div className="space-y-4">
          <Button
            type="button"
            variant={useContent ? "default" : "outline"}
            size="sm"
            onClick={() => setUseContent(!useContent)}
            disabled={mutation.isPending}
            className="gap-2 font-[family-name:var(--font-outfit)]"
          >
            {useContent ? (
              <Trash className="h-3.5 w-3.5" />
            ) : (
              <FileCheck className="h-3.5 w-3.5" />
            )}
            {useContent ? "Remove Content" : "Add Content"}
          </Button>

          {useContent && (
            <div className="space-y-2 pl-4 border-l-2 border-create-accent/30 animate-fade-in-up">
              <Label className="text-sm font-[family-name:var(--font-outfit)] font-medium">
                Content URIs
              </Label>
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
                        setContentUris,
                      )
                    }
                    disabled={mutation.isPending}
                    className="font-[family-name:var(--font-outfit)]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeUriInput(index, contentUris, setContentUris)
                    }
                    disabled={contentUris.length === 1 || mutation.isPending}
                    className="text-muted-foreground hover:text-destructive"
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
                className="gap-2 font-[family-name:var(--font-outfit)]"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Content URI
              </Button>
            </div>
          )}
        </div>

        {/* Measurement URIs Toggle */}
        <div className="space-y-4">
          <Button
            type="button"
            variant={useMeasurements ? "default" : "outline"}
            size="sm"
            onClick={() => setUseMeasurements(!useMeasurements)}
            disabled={mutation.isPending}
            className="gap-2 font-[family-name:var(--font-outfit)]"
          >
            {useMeasurements ? (
              <Trash className="h-3.5 w-3.5" />
            ) : (
              <BarChart3 className="h-3.5 w-3.5" />
            )}
            {useMeasurements ? "Remove Measurements" : "Add Measurements"}
          </Button>

          {useMeasurements && (
            <div className="space-y-2 pl-4 border-l-2 border-create-accent/30 animate-fade-in-up">
              <Label className="text-sm font-[family-name:var(--font-outfit)] font-medium">
                Measurement URIs
              </Label>
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
                        setMeasurementUris,
                      )
                    }
                    disabled={mutation.isPending}
                    className="font-[family-name:var(--font-outfit)]"
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
                    className="text-muted-foreground hover:text-destructive"
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
                className="gap-2 font-[family-name:var(--font-outfit)]"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Measurement URI
              </Button>
            </div>
          )}
        </div>

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

          <Button
            type="button"
            variant={useLocation ? "default" : "outline"}
            size="sm"
            onClick={() => setUseLocation(!useLocation)}
            disabled={mutation.isPending}
            className="gap-2 font-[family-name:var(--font-outfit)]"
          >
            {useLocation ? (
              <Trash className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {useLocation ? "Remove Location" : "Add Location"}
          </Button>

          {useLocation && (
            <div className="space-y-2 animate-fade-in-up">
              <Label
                htmlFor="location"
                className="text-sm font-[family-name:var(--font-outfit)] font-medium"
              >
                Location URI
              </Label>
              <Input
                id="location"
                value={locationUri}
                onChange={(e) => setLocationUri(e.target.value)}
                placeholder="at://did:plc:xxx/app.certified.location/xxx"
                disabled={mutation.isPending}
                className="font-[family-name:var(--font-outfit)]"
              />
            </div>
          )}
        </div>

        <FormFooter
          onBack={onBack}
          onSkip={onNext}
          submitLabel="Save & Next"
          savingLabel="Saving..."
          saving={mutation.isPending}
          submitDisabled={mutation.isPending || !hasEvaluators || !summary}
        />
      </form>
    </FormInfo>
  );
}
