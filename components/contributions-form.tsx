import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addContribution } from "@/lib/create-actions";
import { BaseHypercertFormProps } from "@/lib/types";
import { localDateToAtprotoDatetime } from "@/lib/datetime";
import {
  CONTRIBUTION_WEIGHT_PATTERN,
  isValidContributionWeight,
} from "@/lib/contribution-validation";
import type { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { Trash, PlusCircle, Users, Wand2 } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "./date-range-picker";
import FormFooter from "./form-footer";
import FormInfo from "./form-info";
import UserAvatar from "./user-avatar";
import UserSelection from "./user-selection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function HypercertContributionForm({
  hypercertInfo,
  onBack,
  onNext,
}: BaseHypercertFormProps & {
  onBack?: () => void;
  onNext?: () => void;
}) {
  const [role, setRole] = useState("");
  const [contributors, setContributors] = useState<ProfileView[]>([]);
  const [manualContributors, setManualContributors] = useState<string[]>([""]);
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [workTimeframeFrom, setWorkTimeframeFrom] = useState<Date>();
  const [workTimeframeTo, setWorkTimeframeTo] = useState<Date>();
  const [saving, setSaving] = useState(false);

  const addContributor = (user: ProfileView) => {
    const isAdded = contributors.find(
      (contributor) => contributor.did === user.did,
    );
    if (!isAdded) {
      setContributors((prev) => [...prev, user]);
    }
  };

  const removeContributor = (user: ProfileView) => {
    setContributors((prev) =>
      prev.filter((contributor) => contributor.did !== user.did),
    );
  };

  const addManualContributor = () => {
    setManualContributors((prev) => [...prev, ""]);
  };

  const removeManualContributor = (index: number) => {
    setManualContributors((prev) => prev.filter((_, i) => i !== index));
  };

  const updateManualContributor = (index: number, value: string) => {
    setManualContributors((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleContributionCreation = async () => {
    const mappedContributors: string[] = [];
    for (const c of contributors) mappedContributors.push(c.did);
    for (const uri of manualContributors) {
      const trimmed = uri.trim();
      if (trimmed !== "") mappedContributors.push(trimmed);
    }

    if (!mappedContributors.length) return;

    // Validate hypercertUri exists
    if (!hypercertInfo?.hypercertUri) {
      throw new Error("Hypercert URI is required to create a contribution");
    }

    const contributionRecord = {
      hypercertUri: hypercertInfo.hypercertUri,
      contributors: mappedContributors,
      weight: weight.trim() || undefined,
      contributionDetails: {
        role: role.trim(),
        contributionDescription: description.trim() || undefined,
        startDate: workTimeframeFrom
          ? localDateToAtprotoDatetime(
              workTimeframeFrom,
              "contribution startDate",
            )
          : undefined,
        endDate: workTimeframeTo
          ? localDateToAtprotoDatetime(workTimeframeTo, "contribution endDate")
          : undefined,
      },
    };

    const res = await addContribution(contributionRecord);

    return res;
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!hypercertInfo?.hypercertUri) {
      toast.error("Hypercert information is missing");
      return;
    }
    if (!isValidContributionWeight(weight)) {
      toast.error(
        "Contribution weight must be a positive number like 1, 0.5, or 25.",
      );
      return;
    }
    setSaving(true);
    try {
      await handleContributionCreation();
      toast.success("Contribution created!");
      onNext?.();
    } catch (error) {
      console.error("Error saving contribution:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to create contribution: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const hasContributors =
    contributors.length > 0 || manualContributors.some((c) => c.trim() !== "");

  const handleAutofill = () => {
    setRole("Lead Developer");
    setManualContributors([
      "did:plc:z72i7hdynmk6r22z27h6tvur",
      "did:plc:ragtjsm2j2vknwkz3zp4oxrd",
    ]);
    setWeight("1");
    setDescription(
      "Led the technical development and implementation of the community platform, including backend infrastructure, API design, and database architecture. Coordinated with stakeholders to ensure project milestones were met on time.",
    );
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const endDate = new Date();
    setWorkTimeframeFrom(startDate);
    setWorkTimeframeTo(endDate);
    toast.success("Autofilled contribution form with sample data.");
  };

  return (
    <FormInfo
      stepLabel="Add Contributions"
      title="Add Contributions"
      description="Link roles, contributors, and timeframes to your hypercert."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Autofill */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutofill}
            className="gap-2 font-[family-name:var(--font-outfit)] text-xs"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Autofill Demo
          </Button>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label
            htmlFor="role"
            className="font-[family-name:var(--font-outfit)] text-sm font-medium"
          >
            Role / Title *
          </Label>
          <Input
            id="role"
            placeholder="e.g., Developer, Designer, Researcher"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            maxLength={100}
            required
            disabled={saving}
            className="font-[family-name:var(--font-outfit)]"
          />
          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
            {role.length} / 100 characters
          </p>
        </div>

        {/* Contributors */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
              <Users className="text-create-accent h-3.5 w-3.5" />
            </div>
            <Label className="font-[family-name:var(--font-outfit)] text-sm font-medium">
              Contributors *
            </Label>
          </div>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search Users</TabsTrigger>
              <TabsTrigger value="manual">Enter Identifier</TabsTrigger>
            </TabsList>
            <TabsContent value="search" className="space-y-2 pt-2">
              <UserSelection onUserSelect={addContributor} />
              <div className="flex flex-col gap-2">
                {contributors.map((contributor) => (
                  <div
                    key={contributor.did}
                    className="border-border/60 bg-background/50 flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <UserAvatar user={contributor} />
                    <Button
                      onClick={() => removeContributor(contributor)}
                      variant="ghost"
                      size="icon"
                      aria-label="delete"
                      type="button"
                      disabled={saving}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="manual" className="space-y-2 pt-2">
              {manualContributors.map((uri, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="govtech.bt, jaggle.ai, did:plc:..., https://..."
                    value={uri}
                    onChange={(e) =>
                      updateManualContributor(index, e.target.value)
                    }
                    disabled={saving}
                    className="font-[family-name:var(--font-outfit)]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeManualContributor(index)}
                    disabled={manualContributors.length === 1 || saving}
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
                Use any stable contributor identifier: an org domain, website
                URL, DID, AT-URI, or social profile.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={addManualContributor}
                disabled={saving}
                type="button"
                className="gap-2 font-[family-name:var(--font-outfit)]"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Contributor
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <Label
            htmlFor="weight"
            className="font-[family-name:var(--font-outfit)] text-sm font-medium"
          >
            Contribution Weight (Optional)
          </Label>
          <Input
            id="weight"
            type="text"
            inputMode="decimal"
            pattern={CONTRIBUTION_WEIGHT_PATTERN}
            title="Use a positive number like 1, 0.5, or 25."
            placeholder="e.g., 1, 0.5, 25"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            maxLength={100}
            disabled={saving}
            className="font-[family-name:var(--font-outfit)]"
          />
          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
            Relative contribution weight. Values do not need to add up to 100.
          </p>
          {!isValidContributionWeight(weight) ? (
            <p className="font-[family-name:var(--font-outfit)] text-sm text-amber-600">
              Contribution weight must be a positive number like 1, 0.5, or 25.
            </p>
          ) : null}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="font-[family-name:var(--font-outfit)] text-sm font-medium"
          >
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            placeholder="What the contribution concretely achieved..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={4}
            disabled={saving}
            className="font-[family-name:var(--font-outfit)]"
          />
          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
            {description.length} / 1000 characters
          </p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          savingLabel="Saving..."
          saving={saving}
          submitDisabled={
            !hasContributors ||
            !role ||
            !isValidContributionWeight(weight) ||
            saving
          }
        />
      </form>
    </FormInfo>
  );
}
