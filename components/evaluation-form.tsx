"use client";

import { Trash } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import FormFooter from "./form-footer";
import FormInfo from "./form-info";
import UserAvatar from "./user-avatar";
import UserSelection from "./user-selection";

import { useOAuthContext } from "@/providers/OAuthProviderSSR";

import { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";

import * as Evaluation from "@/lexicons/types/org/hypercerts/claim/evaluation";

import { createEvaluation, getHypercert } from "@/lib/queries";
import { Collections } from "@/lib/types";
import { buildStrongRef, validateEvaluation } from "@/lib/utils";

export default function HypercertEvaluationForm({
  hypercertId,
}: {
  hypercertId: string;
  onBack?: () => void;
  onNext?: () => void;
  /** Used when shown as a toggleable panel on the details page */
  onCancel?: () => void;
}) {
  const { atProtoAgent } = useOAuthContext();

  const [evaluators, setEvaluators] = useState<ProfileView[]>([]);
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  const addEvaluator = (user: ProfileView) => {
    const isAdded = evaluators.find((evaluator) => evaluator.did === user.did);
    if (!isAdded) {
      setEvaluators((prev) => [...prev, user]);
    }
  };

  const removeEvaluator = (user: ProfileView) => {
    const filtered = evaluators.filter(
      (evaluator) => evaluator.did !== user.did
    );
    setEvaluators(filtered);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!atProtoAgent) return;

    const mappedEvaluators = evaluators
      .filter((evaluator) => !!evaluator)
      .map(({ did }) => did);

    if (!mappedEvaluators.length) {
      toast.error("Please add at least one evaluator");
      return;
    }

    if (!summary.trim()) {
      toast.error("Please add an evaluation summary");
      return;
    }

    try {
      setSaving(true);
      const hypercertInfo = await getHypercert(hypercertId, atProtoAgent);
      const hypercertRef = buildStrongRef(
        hypercertInfo.data.cid,
        hypercertInfo.data.uri
      );
      if (!hypercertRef) return;

      const evaluationRecord: Evaluation.Record = {
        $type: Collections.evaluation,
        subject: hypercertRef,
        evaluators: mappedEvaluators,
        summary: summary.trim(),
        createdAt: new Date().toISOString(),
      };

      const isValidEvaluation = validateEvaluation(evaluationRecord);
      if (!isValidEvaluation.success) {
        toast.error(isValidEvaluation.error || "Invalid contribution record");
        return;
      }

      await createEvaluation(
        atProtoAgent,
        evaluationRecord as Evaluation.Record
      );

      toast.success("Evaluation submitted!");
      setSummary("");
      setEvaluators([]);
    } catch (error) {
      console.error("Error creating evaluation:", error);
      toast.error("Failed to submit evaluation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormInfo
      stepLabel="Evaluation"
      title="Evaluate Hypercert"
      description="Add an evaluation summary and evaluators for this hypercert."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Evaluators (DIDs) *</Label>
          <div className="space-y-2">
            <UserSelection onUserSelect={addEvaluator} />
            <div className="flex flex-col gap-2">
              {evaluators.map((evaluator) => (
                <div
                  key={evaluator.did}
                  className="flex justify-between gap-4 border p-2 rounded-md"
                >
                  <UserAvatar user={evaluator} />
                  <Button
                    onClick={() => removeEvaluator(evaluator)}
                    variant={"outline"}
                    size={"icon"}
                    aria-label="delete"
                    type="button"
                  >
                    <Trash />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Evaluation Summary *</Label>
          <Textarea
            id="summary"
            placeholder="Provide a brief evaluation of the hypercert, including criteria, methodology, and overall conclusion…"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={5000}
            rows={6}
            required
          />
          <p className="text-xs text-muted-foreground">
            {summary.length} / 5000 characters
          </p>
        </div>

        <FormFooter
          submitLabel="Save Evaluation"
          savingLabel="Saving…"
          saving={saving}
        />
      </form>
    </FormInfo>
  );
}
