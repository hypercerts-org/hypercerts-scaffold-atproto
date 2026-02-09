import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addContribution } from "@/lib/create-actions";
import { BaseHypercertFormProps } from "@/lib/types";
import type { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { Trash, PlusCircle, Users } from "lucide-react";
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
    setContributors((prev) =>
      prev.filter((contributor) => contributor.did !== user.did)
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
    const mappedContributors = [
      ...contributors.map(({ did }) => did),
      ...manualContributors.filter((uri) => uri.trim() !== ""),
    ];

    if (!mappedContributors.length) return;
    
    // Validate hypercertUri exists
    if (!hypercertInfo?.hypercertUri) {
      throw new Error("Hypercert URI is required to create a contribution");
    }

    const contributionRecord = {
      hypercertUri: hypercertInfo.hypercertUri,
      contributors: mappedContributors,
      contributionDetails: {
        role,
        contributionDescription: description || undefined,
        startDate: workTimeframeFrom?.toISOString(),
        endDate: workTimeframeTo?.toISOString(),
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
    setSaving(true);
    try {
      const contributionData = await handleContributionCreation();
      console.log(contributionData);
      toast.success("Contribution created!");
      onNext?.();
    } catch (error) {
      console.error("Error saving contribution:", error);
      toast.error("Failed to create contribution");
    } finally {
      setSaving(false);
    }
  };

  const hasContributors =
    contributors.length > 0 || manualContributors.some((c) => c.trim() !== "");

  return (
    <FormInfo
      stepLabel="Step 2 of 6"
      title="Add Contributions"
      description="Link roles, contributors, and timeframes to your hypercert."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm font-[family-name:var(--font-outfit)] font-medium">
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
        </div>

        {/* Contributors */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-create-accent/10 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-create-accent" />
            </div>
            <Label className="text-sm font-[family-name:var(--font-outfit)] font-medium">
              Contributors *
            </Label>
          </div>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search Users</TabsTrigger>
              <TabsTrigger value="manual">Enter URI or DID</TabsTrigger>
            </TabsList>
            <TabsContent value="search" className="space-y-2 pt-2">
              <UserSelection onUserSelect={addContributor} />
              <div className="flex flex-col gap-2">
                {contributors.map((contributor) => (
                  <div
                    key={contributor.did}
                    className="flex justify-between items-center gap-4 border border-border/60 p-3 rounded-lg bg-background/50"
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
                    placeholder="at://did:plc:..., https://..., did:eth:..."
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
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addManualContributor}
                disabled={saving}
                className="gap-2 font-[family-name:var(--font-outfit)]"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Add Contributor
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-[family-name:var(--font-outfit)] font-medium">
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            placeholder="What the contribution concretely achieved..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
            disabled={saving}
            className="font-[family-name:var(--font-outfit)]"
          />
          <p className="text-[11px] font-[family-name:var(--font-outfit)] text-muted-foreground">
            {description.length} / 2000 characters
          </p>
        </div>

        {/* Dates */}
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
          savingLabel="Saving..."
          saving={saving}
          submitDisabled={!hasContributors || !role || saving}
        />
      </form>
    </FormInfo>
  );
}
