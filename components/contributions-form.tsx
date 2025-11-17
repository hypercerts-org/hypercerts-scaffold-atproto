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
import { HypercertRecordData } from "@/lib/types";
import {
  parseAtUri,
  validateContribution,
  validateHypercert,
} from "@/lib/utils";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ArrowLeft, Plus, X } from "lucide-react";
import { FormEventHandler, useEffect, useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "./date-range-picker";
import { Spinner } from "./ui/spinner";

export default function HypercertContributionForm({
  hypercertId,
  hypercertData,
  onBack,
}: {
  hypercertId: string;
  hypercertData?: HypercertRecordData;
  onBack?: () => void;
}) {
  const { atProtoAgent } = useOAuthContext();

  const hypercertRef = {
    $type: "com.atproto.repo.strongRef",
    uri: hypercertData?.uri,
    cid: hypercertData?.cid,
  };

  const hypercertRecord = hypercertData?.value;

  const [role, setRole] = useState("");
  const [contributors, setContributors] = useState([""]);
  const [description, setDescription] = useState("");
  const [workTimeframeFrom, setWorkTimeframeFrom] = useState<Date>();
  const [workTimeframeTo, setWorkTimeframeTo] = useState<Date>();
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Prefill from first contribution (if present)
  useEffect(() => {
    async function fetchContributionData() {
      if (!atProtoAgent || !hypercertRecord?.contributions?.length) return;

      const firstRef = hypercertRecord.contributions[0];
      const parsed = parseAtUri(firstRef?.uri);
      if (!parsed) return;

      try {
        setFetching(true);
        const response = await atProtoAgent.com.atproto.repo.getRecord({
          repo: parsed.did,
          collection: parsed.collection || "org.hypercerts.claim.contribution",
          rkey: parsed.rkey,
        });

        const value = response?.data?.value as Contribution.Record | undefined;
        if (!value) return;

        setRole(value.role ?? "");
        setContributors(
          Array.isArray(value.contributors) && value.contributors.length > 0
            ? value.contributors
            : [""]
        );
        setDescription(value.description ?? "");
        setWorkTimeframeFrom(
          value.workTimeframeFrom
            ? new Date(value.workTimeframeFrom)
            : undefined
        );
        setWorkTimeframeTo(
          value.workTimeframeTo ? new Date(value.workTimeframeTo) : undefined
        );
      } catch (e) {
        console.error("Failed to prefill contribution:", e);
      } finally {
        setFetching(false);
      }
    }
    fetchContributionData();
  }, [hypercertRecord, atProtoAgent]);

  const addContributor = () => setContributors((arr) => [...arr, ""]);
  const removeContributor = (index: number) =>
    setContributors((arr) => arr.filter((_, idx) => idx !== index));
  const updateContributor = (index: number, value: string) =>
    setContributors((arr) => arr.map((v, i) => (i === index ? value : v)));

  const createContribution = async (
    contributionRecord: Contribution.Record
  ) => {
    const response = await atProtoAgent?.com.atproto.repo.createRecord({
      rkey: String(Date.now()),
      record: contributionRecord,
      collection: "org.hypercerts.claim.contribution",
      repo: atProtoAgent.assertDid,
    });
    return response;
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
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

    try {
      setSaving(true);

      const response = await createContribution(
        contributionRecord as Contribution.Record
      );

      const contributionCid = response?.data?.cid;
      const contributionURI = response?.data?.uri;
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

      await atProtoAgent.com.atproto.repo.putRecord({
        rkey: hypercertId,
        repo: atProtoAgent.assertDid,
        collection: "org.hypercerts.claim",
        record: updatedHypercert,
      });

      toast.success("Contribution updated and linked!");
    } catch (error) {
      console.error("Error saving contribution:", error);
      toast.error("Failed to update contribution");
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Step 2 of 2 · Contributions
                </p>
                <CardTitle className="text-2xl mt-1">
                  {hypercertRecord?.contributions?.length ? "Update" : "Add"}{" "}
                  Hypercert Contribution
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
                  {saving ? "Saving…" : "Update Contribution"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
