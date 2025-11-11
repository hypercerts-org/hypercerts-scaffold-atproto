import { FormEventHandler, useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { DatePicker } from "./date-range-picker";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import * as Contribution from "@/lexicons/types/org/hypercerts/claim/contribution";
import { toast } from "sonner";
import { CertData } from "@/app/[hypercertId]/page";
import {
  parseAtUri,
  validateContribution,
  validateHypercert,
} from "@/lib/utils";

export default function HypercertContributionForm({
  hypercertId,
  hypercertData,
}: {
  hypercertId: string;
  hypercertData?: CertData;
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

  const addContributor = () => {
    setContributors([...contributors, ""]);
  };

  const removeContributor = (index: number) => {
    setContributors(contributors.filter((_, idx) => idx !== index));
  };

  const updateContributor = (index: number, value: string) => {
    const updated = [...contributors];
    updated[index] = value;
    setContributors(updated);
  };

  const createContribution = async (
    contributionRecord: Contribution.Record
  ) => {
    const response = await atProtoAgent?.com.atproto.repo.createRecord({
      rkey: new Date().getTime().toString(),
      record: contributionRecord,
      collection: "org.hypercerts.claim.contribution",
      repo: atProtoAgent.assertDid,
    });
    return response;
  };
  useEffect(() => {
    async function fetchContributionData() {
      if (!atProtoAgent || !hypercertRecord) return;
      const contributionURI = parseAtUri(
        hypercertRecord?.contributions?.[0]?.uri
      );
      if (contributionURI) {
        const response = await atProtoAgent.com.atproto.repo.getRecord({
          repo: atProtoAgent.assertDid,
          collection: "org.hypercerts.claim.contribution",
          rkey: contributionURI.rkey,
        });
        return response.data;
      }
    }
    async function prefillFromExistingContribution() {
      if (!atProtoAgent) return;
      try {
        const data = await fetchContributionData();

        const contributionRecord = data?.value as
          | Contribution.Record
          | undefined;
        if (!contributionRecord) return;
        setRole(contributionRecord.role ?? "");
        setContributors(
          Array.isArray(contributionRecord.contributors) &&
            contributionRecord.contributors.length > 0
            ? contributionRecord.contributors
            : [""]
        );
        setDescription(contributionRecord.description ?? "");
        setWorkTimeframeFrom(
          contributionRecord.workTimeframeFrom
            ? new Date(contributionRecord.workTimeframeFrom)
            : undefined
        );
        setWorkTimeframeTo(
          contributionRecord.workTimeframeTo
            ? new Date(contributionRecord.workTimeframeTo)
            : undefined
        );
      } catch (e) {
        console.error("Failed to prefill contribution:", e);
      }
    }
    prefillFromExistingContribution();
  }, [hypercertRecord, atProtoAgent]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const contributionRecord = {
      $type: "org.hypercerts.claim.contribution",
      hypercert: hypercertRef || undefined,
      role,
      contributors: contributors.filter((c) => c.trim() !== ""),
      description: description,
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
      const response = await createContribution(
        contributionRecord as Contribution.Record
      );
      const contributionCid = response?.data.cid;
      const contributionURI = response?.data.uri;
      if (!contributionCid || !contributionURI) {
        return;
      }
      const updatedHypercert = {
        ...hypercertRecord,
        contributions: [
          ...(hypercertRecord?.contributions || []),
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
      await atProtoAgent?.com.atproto.repo.putRecord({
        rkey: hypercertId,
        repo: atProtoAgent.assertDid,
        collection: "org.hypercerts.claim",
        record: updatedHypercert,
      });
      toast.success("Contribution created and linked successfully!");
    } catch (error) {
      console.error("Error creating contribution:", error);
      toast.error("Failed to create contribution");
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">
              Create Hypercert Contribution
            </CardTitle>
            <CardDescription>
              Record a contribution made toward a hypercert&apos;s impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role */}
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

              {/* Contributors */}
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

              {/* Description */}
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
                <p className="text-xs text-gray-500">
                  {description.length} / 2000 characters
                </p>
              </div>

              {/* Work Timeframe */}
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

              {/* Submit Button */}
              <Button type="submit" className="w-full">
                Create Contribution
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
