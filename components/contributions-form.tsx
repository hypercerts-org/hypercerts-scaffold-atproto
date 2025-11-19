import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import * as Claim from "@/lexicons/types/org/hypercerts/claim";
import * as Contribution from "@/lexicons/types/org/hypercerts/claim/contribution";
import {
  createContribution,
  getHypercert,
  updateHypercert,
} from "@/lib/queries";
import { validateContribution, validateHypercert } from "@/lib/utils";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ComAtprotoRepoGetRecord } from "@atproto/api";
import { Plus, X } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "./date-range-picker";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";

export default function HypercertContributionForm({
  hypercertId,
  onBack,
  onNext,
}: {
  hypercertId: string;
  onBack?: () => void;
  onNext?: () => void;
}) {
  const { atProtoAgent } = useOAuthContext();
  const [role, setRole] = useState("");
  const [contributors, setContributors] = useState([""]);
  const [description, setDescription] = useState("");
  const [workTimeframeFrom, setWorkTimeframeFrom] = useState<Date>();
  const [workTimeframeTo, setWorkTimeframeTo] = useState<Date>();
  const [saving, setSaving] = useState(false);
  const addContributor = () => setContributors((arr) => [...arr, ""]);
  const removeContributor = (index: number) =>
    setContributors((arr) => arr.filter((_, idx) => idx !== index));
  const updateContributor = (index: number, value: string) =>
    setContributors((arr) => arr.map((v, i) => (i === index ? value : v)));

  const buildHypercertRef = (
    hypercertData: ComAtprotoRepoGetRecord.Response
  ) => {
    if (!hypercertData) return;
    return {
      $type: "com.atproto.repo.strongRef",
      uri: hypercertData.data.uri,
      cid: hypercertData.data.cid,
    };
  };

  const handleContributionCreation = async (
    hypercertRef: ReturnType<typeof buildHypercertRef>
  ) => {
    if (!atProtoAgent) return;
    const contributionRecord = {
      $type: "org.hypercerts.claim.contribution",
      hypercert: hypercertRef || undefined,
      role,
      contributors: contributors.filter((c) => c.trim() !== ""),
      description: description || undefined,
      workTimeframeFrom: workTimeframeFrom?.toISOString(),
      workTimeframeTo: workTimeframeTo?.toISOString(),
      createdAt: new Date().toISOString(),
    };

    const isValidContribution = validateContribution(contributionRecord);
    if (!isValidContribution.success) {
      toast.error(isValidContribution.error || "Invalid contribution record");
      return;
    }
    const response = await createContribution(
      atProtoAgent,
      contributionRecord as Contribution.Record
    );
    return response;
  };

  const handleHypercertUpdate = async (
    contributionData: Awaited<ReturnType<typeof handleContributionCreation>>,
    hypercertRecord: Claim.Record
  ) => {
    const contributionCid = contributionData?.data?.cid;
    const contributionURI = contributionData?.data?.uri;
    if (!contributionCid || !contributionURI) return;
    const updatedHypercert = {
      ...hypercertRecord,
      contributions: [
        {
          $type: "com.atproto.repo.strongRef",
          cid: contributionCid,
          uri: contributionURI,
        },
      ],
    };
    const isValidHypercert = validateHypercert(updatedHypercert);
    if (!isValidHypercert.success) {
      toast.error(isValidHypercert.error || "Invalid updated hypercert");
      return;
    }
    await updateHypercert(
      hypercertId,
      atProtoAgent!,
      updatedHypercert as Claim.Record
    );
    toast.success("Contribution updated and linked!");
    onNext?.();
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!atProtoAgent) return;
    const hypercertInfo = await getHypercert(hypercertId, atProtoAgent);
    const hypercertRef = buildHypercertRef(hypercertInfo);
    const hypercertRecord = (hypercertInfo.data.value || {}) as Claim.Record;
    try {
      setSaving(true);
      const contributionData = await handleContributionCreation(hypercertRef);
      await handleHypercertUpdate(contributionData, hypercertRecord);
    } catch (error) {
      console.error("Error saving contribution:", error);
      toast.error("Failed to update contribution");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormInfo
      stepLabel="Step 2 of 5 . Evidence"
      title="Add Hypercert Contribution"
      description="Link roles,contributors and timeframes"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="role">Role / Title *</Label>
          <Input
            id="role"
            placeholder="e.g., Developer, Designer, Researcher"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            maxLength={100}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Contributors (DIDs) *</Label>
          <div className="space-y-2">
            {contributors.map((contributor, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="did:plc:123..."
                  value={contributor}
                  onChange={(e) => updateContributor(index, e.target.value)}
                  required
                />
                {contributors.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeContributor(index)}
                    aria-label={`Remove contributor ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addContributor}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contributor
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="What the contribution concretely achieved..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {description.length} / 2000 characters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <DatePicker
              label="Work Started"
              initDate={workTimeframeFrom}
              onChange={setWorkTimeframeFrom}
            />
          </div>
          <div className="space-y-2">
            <DatePicker
              label="Work Finished"
              initDate={workTimeframeTo}
              onChange={setWorkTimeframeTo}
            />
          </div>
        </div>

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
