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
import {
  buildStrongRef,
  validateContribution,
  validateHypercert,
} from "@/lib/utils";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { Trash } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "./date-range-picker";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";
import UserAvatar from "./user-avatar";
import UserSelection from "./user-selection";

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
  const [contributors, setContributors] = useState<ProfileView[]>([]);
  const [description, setDescription] = useState("");
  const [workTimeframeFrom, setWorkTimeframeFrom] = useState<Date>();
  const [workTimeframeTo, setWorkTimeframeTo] = useState<Date>();
  const [saving, setSaving] = useState(false);

  const addContributor = (user: ProfileView) => {
    const isAdded = contributors.find(
      (contributor) => contributor.did === user.did
    );
    if (!isAdded) {
      setContributors((prev) => [...prev, user]);
    }
  };

  const removeContributor = (user: ProfileView) => {
    const filtered = contributors.filter(
      (contributor) => contributor.did !== user.did
    );
    setContributors(filtered);
  };

  const handleContributionCreation = async (
    hypercertRef: ReturnType<typeof buildStrongRef>
  ) => {
    if (!atProtoAgent) return;
    const mappedContributors = contributors
      .filter((contributor) => !!contributor)
      .map(({ did }) => did);
    const contributionRecord = {
      $type: "org.hypercerts.claim.contribution",
      hypercert: hypercertRef || undefined,
      role,
      contributors: mappedContributors.length ? mappedContributors : undefined,
      description: description || undefined,
      workTimeframeFrom: workTimeframeFrom?.toISOString(),
      workTimeframeTo: workTimeframeTo?.toISOString(),
      createdAt: new Date().toISOString(),
    };

    const isValidContribution = validateContribution(contributionRecord);
    if (!isValidContribution.success || !mappedContributors.length) {
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
      contributions: [buildStrongRef(contributionCid, contributionURI)],
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
    const hypercertRef = buildStrongRef(
      hypercertInfo.data.cid,
      hypercertInfo.data.uri
    );
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
        <div className="space-y-2"></div>

        <div className="space-y-2">
          <Label>Contributors (DIDs) *</Label>
          <div className="space-y-2">
            <UserSelection onUserSelect={addContributor} />
            <div className="flex flex-col gap-2">
              {contributors.map((contributor) => (
                <div
                  key={contributor.did}
                  className="flex justify-between gap-4 border p-2 rounded-md"
                >
                  <UserAvatar user={contributor} />
                  <Button
                    onClick={() => removeContributor(contributor)}
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
