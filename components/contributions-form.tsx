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
import * as Contribution from "@/lexicons/types/org/hypercerts/claim/contribution";
import * as Claim from "@/lexicons/types/org/hypercerts/claim";
import {
  createContribution,
  getHypercert,
  updateHypercert,
} from "@/lib/queries";
import { validateContribution, validateHypercert } from "@/lib/utils";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ComAtprotoRepoGetRecord } from "@atproto/api";
import { ArrowLeft, Plus, X } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "./date-range-picker";
import { Spinner } from "./ui/spinner";

export default function HypercertContributionForm({
  hypercertId,
  onBack,
  onSkip,
}: {
  hypercertId: string;
  onBack?: () => void;
  onSkip?: () => void;
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
    onSkip?.();
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
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mt-1">
                  Add Hypercert Contribution
                </CardTitle>
                <CardDescription className="mt-1">
                  Link roles, contributors, and timeframes for this hypercert.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
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
                        onChange={(e) =>
                          updateContributor(index, e.target.value)
                        }
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

              <div className="flex items-center justify-end gap-4 pt-2">
                {!!onBack && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
                {!!onSkip && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSkip}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                    Skip
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-[180px]"
                >
                  {saving ? "Adding" : "Add Contribution & Next"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
