"use client";
import HypercertRightsFields, {
  RightsState,
} from "@/components/hypercerts-rights-fields";
import { DatePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import * as Hypercert from "@/lexicons/types/org/hypercerts/claim/activity";
import { CreateHypercertParams } from "@hypercerts-org/sdk-core";
import { Label } from "@radix-ui/react-label";
import { PlusIcon, XIcon, Trash, ChevronDown, ChevronUp } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import UserSelection from "./user-selection";
import UserAvatar from "./user-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export interface HypercertsBaseFormProps {
  isSaving: boolean;
  saveDisabled: boolean;
  onSave?: (record: CreateHypercertParams, advance?: boolean) => void;
  updateActions?: boolean;
  certInfo?: Hypercert.Record;
  hypercertUri?: string;
  nextStepper: () => void;
}

export interface HypercertRecordForm {
  title: string;
  shortDescription: string;
  workScope: string;
  image?: File;
  logo?: File;
  workTimeFrameFrom: string;
  workTimeFrameTo: string;
  createdAt: string;
}

export default function HypercertsBaseForm({
  isSaving,
  saveDisabled,
  onSave,
  updateActions,
  certInfo,
  hypercertUri,
  nextStepper,
}: HypercertsBaseFormProps) {
  const initialWorkScope = certInfo?.workScope
    .split(",")
    .map((scope) => scope.trim());
  const [title, setTitle] = useState(certInfo?.title || "");
  const [backgroundImage, setBackgroundImage] = useState<File | undefined>();
  const [shortDescription, setShortDescription] = useState(
    certInfo?.shortDescription || "",
  );
  const [buttonClicked, setButtonClicked] = useState<"saveNext" | "create">();
  const [workScope, setWorkScope] = useState<string[]>(
    initialWorkScope || [""],
  );
  const [startDate, setStartDate] = useState<Date | null>(
    certInfo?.workTimeFrameFrom ? new Date(certInfo?.workTimeFrameFrom) : null,
  );
  const [endDate, setEndDate] = useState<Date | null>(
    certInfo?.workTimeFrameTo ? new Date(certInfo?.workTimeFrameTo) : null,
  );
  const [rights, setRights] = useState<RightsState>({
    name: "",
    type: "",
    description: "",
  });

  // Contributions state
  const [showContributions, setShowContributions] = useState(false);
  const [contributionRole, setContributionRole] = useState("");
  const [contributors, setContributors] = useState<ProfileView[]>([]);
  const [manualContributors, setManualContributors] = useState<string[]>([""]);
  const [contributionDescription, setContributionDescription] = useState("");
  const [contributionStartDate, setContributionStartDate] = useState<Date | null>(null);
  const [contributionEndDate, setContributionEndDate] = useState<Date | null>(null);

  const handleWorkScopeChange = (index: number, value: string) => {
    setWorkScope((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const addWorkScopeField = () => {
    setWorkScope((prev) => [...prev, ""]);
  };

  const removeWorkScopeField = (index: number) => {
    setWorkScope((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Contributor helper functions
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

  const addManualContributor = () => {
    setManualContributors([...manualContributors, ""]);
  };

  const removeManualContributor = (index: number) => {
    setManualContributors(manualContributors.filter((_, i) => i !== index));
  };

  const updateManualContributor = (index: number, value: string) => {
    const newManualContributors = [...manualContributors];
    newManualContributors[index] = value;
    setManualContributors(newManualContributors);
  };

  const hasContributors =
    contributors.length > 0 || manualContributors.some((c) => c.trim() !== "");

  const getRecord = (): CreateHypercertParams | undefined => {
    const cleanedWorkScope = workScope.map((w) => w.trim()).filter(Boolean);

    if (
      !rights.name.trim() ||
      !rights.type.trim() ||
      !rights.description.trim()
    ) {
      return;
    }

    if (!(title && shortDescription && startDate && endDate)) {
      return;
    }

    // Build contributions array if contributors exist
    let contributions: CreateHypercertParams["contributions"] = undefined;
    if (hasContributors && contributionRole.trim()) {
      const mappedContributors = [
        ...contributors.map(({ did }) => did),
        ...manualContributors.filter((uri) => uri.trim() !== ""),
      ];

      contributions = [
        {
          contributors: mappedContributors,
          contributionDetails: {
            role: contributionRole,
            contributionDescription: contributionDescription || undefined,
            startDate: contributionStartDate?.toISOString(),
            endDate: contributionEndDate?.toISOString(),
          },
        },
      ];
    }

    const record: CreateHypercertParams = {
      title,
      shortDescription,
      rights: {
        name: rights.name.trim(),
        type: rights.type.trim(),
        description: rights.description.trim(),
      },
      // TODO map properly once fixed on sdk side
      // workScope: cleanedWorkScope.length > 0 ? {
      //   $type: "org.hypercerts.defs#workScopeAny",
      //   op: "any" as const,
      //   args: cleanedWorkScope.map(label => ({
      //     $type: "org.hypercerts.defs#workScopeAtom" as const,
      //     label,
      //   })),
      // } : undefined,
      description: shortDescription,
      image: backgroundImage,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      contributions,
    };
    return record;
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setButtonClicked("create");
    const record = getRecord();
    if (!record) return;
    onSave?.(record, false);
  };

  const next = () => {
    // setButtonClicked("saveNext");
    // const record = getRecord();
    // if (!record) return;
    // onSave?.(record, true);
    nextStepper();
  };

  const handleAutofill = () => {
    setRights({
      name: "Creative Commons Attribution 4.0",
      type: "cc-by-4.0",
      description:
        "This hypercert is licensed under CC BY 4.0. Attribution required.",
    });
    setTitle(
      `Clean Energy Community Initiative ${(Math.random() * 100).toFixed(0)}`,
    );
    setShortDescription(
      "A community-driven initiative to distribute clean energy resources and fund renewable projects across rural regions.",
    );
    setWorkScope(["clean-energy", "community", "renewables"]);

    const from = new Date();
    from.setMonth(from.getMonth() - 6);
    const to = new Date();
    to.setMonth(to.getMonth() + 6);
    setStartDate(from);
    setEndDate(to);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex">
        <Button
          type="button"
          variant="outline"
          onClick={handleAutofill}
          aria-label="Autofill with dummy values"
        >
          Autofill
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="title">Hypercert Name *</Label>
        <Input
          id="title"
          onChange={(e) => setTitle(e.target.value)}
          value={title}
          placeholder="Enter the hypercert name"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="description">Short Description * </Label>
        <Textarea
          onChange={(e) => setShortDescription(e.target.value)}
          id="description"
          value={shortDescription}
          placeholder="Enter a short description"
          required
        />
      </div>
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="text-lg font-semibold">Rights</h3>
        <p className="text-sm text-muted-foreground">
          Rights information is required to create a Hypercert.
        </p>

        <HypercertRightsFields value={rights} onChange={setRights} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="background-image">Background Image</Label>
        <Input
          id="background-image"
          onChange={(e) => setBackgroundImage(e.target.files?.[0])}
          type="file"
          placeholder="Add Background Image"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="workScope">Work Scope Tags * </Label>
        <div id="workScope" className="flex w-full flex-col gap-2">
          {workScope.map((value, index) => (
            <div key={index} className="flex w-full justify-between gap-2">
              <Input
                value={value}
                onChange={(e) => handleWorkScopeChange(index, e.target.value)}
                placeholder="Enter a tag"
                required={index === 0}
              />
              {workScope.length > 1 && index !== 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size={"icon"}
                  onClick={() => removeWorkScopeField(index)}
                  aria-label="Remove tag"
                >
                  <XIcon />
                </Button>
              )}
              {!!workScope[index] && index === workScope.length - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size={"icon"}
                  onClick={addWorkScopeField}
                  aria-label="Add another work scope tag"
                >
                  <PlusIcon />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <DatePicker
            initDate={startDate || undefined}
            onChange={setStartDate}
            label="Work Time Frame From"
          />
        </div>
        <div>
          <DatePicker
            initDate={endDate || undefined}
            onChange={setEndDate}
            label="Work Time Frame To"
          />
        </div>
      </div>

      {/* Contributors Section (Optional) */}
      <div className="rounded-lg border p-4 space-y-4">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowContributions(!showContributions)}
        >
          <div>
            <h3 className="text-lg font-semibold">Contributors (Optional)</h3>
            <p className="text-sm text-muted-foreground">
              Add contributors and their roles for this hypercert
            </p>
          </div>
          {showContributions ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>

        {showContributions && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="contribution-role">Role / Title</Label>
              <Input
                id="contribution-role"
                placeholder="e.g., Developer, Designer, Researcher"
                value={contributionRole}
                onChange={(e) => setContributionRole(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Contributors</Label>
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
                        className="flex justify-between items-center gap-4 border p-2 rounded-md"
                      >
                        <UserAvatar user={contributor} />
                        <Button
                          onClick={() => removeContributor(contributor)}
                          variant={"outline"}
                          size={"icon"}
                          aria-label="delete"
                          type="button"
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
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeManualContributor(index)}
                        disabled={manualContributors.length === 1}
                        type="button"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addManualContributor}
                    type="button"
                  >
                    <PlusIcon className="mr-2 h-4 w-4" /> Add Contributor
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contribution-description">
                Contribution Description (Optional)
              </Label>
              <Textarea
                id="contribution-description"
                placeholder="What the contribution concretely achieved..."
                value={contributionDescription}
                onChange={(e) => setContributionDescription(e.target.value)}
                maxLength={2000}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {contributionDescription.length} / 2000 characters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <DatePicker
                  label="Contribution Started"
                  initDate={contributionStartDate || undefined}
                  onChange={setContributionStartDate}
                />
              </div>
              <div className="space-y-2">
                <DatePicker
                  label="Contribution Finished"
                  initDate={contributionEndDate || undefined}
                  onChange={setContributionEndDate}
                />
              </div>
            </div>

            {hasContributors && !contributionRole.trim() && (
              <p className="text-sm text-amber-600">
                Please enter a role for the contributors
              </p>
            )}
          </div>
        )}
      </div>

      {!!updateActions && (
        <div className="flex gap-3 justify-end pt-2">
          <Button
            type="submit"
            variant="outline"
            disabled={isSaving}
            aria-label="Save"
          >
            {isSaving && <Spinner className="mr-2" />}
            {isSaving && buttonClicked === "create" ? "Creating…" : "Create"}
          </Button>

          <Button
            type="button"
            disabled={!hypercertUri || isSaving}
            onClick={next}
            aria-label="Save and go to Contributions"
          >
            {isSaving && <Spinner className="mr-2" />}
            {isSaving && buttonClicked === "saveNext" ? "Creating…" : "Next"}
          </Button>
        </div>
      )}

      {!updateActions && (
        <Button disabled={saveDisabled || isSaving} type="submit">
          {isSaving && <Spinner />}
          {isSaving ? "Creating Hypercert" : "Create Hypercert"}
        </Button>
      )}
    </form>
  );
}
