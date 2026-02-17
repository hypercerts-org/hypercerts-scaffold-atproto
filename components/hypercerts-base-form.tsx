"use client";
import Image from "next/image";
import HypercertRightsFields, {
  RightsState,
} from "@/components/hypercerts-rights-fields";
import { DatePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { Record as HypercertRecord } from "@/lexicons/types/org/hypercerts/claim/activity";
import type { CreateHypercertParams } from "@hypercerts-org/sdk-core";
import { Label } from "@radix-ui/react-label";
import {
  PlusIcon,
  XIcon,
  Trash,
  ChevronDown,
  ChevronUp,
  Wand2,
  Upload,
  Shield,
  Tag,
  Calendar,
  Users as UsersIcon,
} from "lucide-react";
import { FormEventHandler, useState } from "react";
import type { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import UserSelection from "./user-selection";
import UserAvatar from "./user-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export interface HypercertsBaseFormProps {
  isSaving: boolean;
  saveDisabled: boolean;
  onSave?: (record: CreateHypercertParams, advance?: boolean) => void;
  updateActions?: boolean;
  certInfo?: HypercertRecord;
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
  const [contributionStartDate, setContributionStartDate] =
    useState<Date | null>(null);
  const [contributionEndDate, setContributionEndDate] = useState<Date | null>(
    null,
  );

  // Image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const hasContributors =
    contributors.length > 0 || manualContributors.some((c) => c.trim() !== "");

  const getRecord = (): CreateHypercertParams | undefined => {
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
      const mappedContributors: string[] = [];
      for (const c of contributors) mappedContributors.push(c.did);
      for (const uri of manualContributors) {
        if (uri.trim() !== "") mappedContributors.push(uri);
      }

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
    nextStepper();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setBackgroundImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Autofill */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAutofill}
          aria-label="Autofill with dummy values"
          className="gap-2 text-xs font-[family-name:var(--font-outfit)]"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Autofill Demo
        </Button>
      </div>

      {/* ── Section: Core Details ── */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-lg bg-create-accent/10 flex items-center justify-center">
            <Tag className="h-3.5 w-3.5 text-create-accent" />
          </div>
          <h3 className="text-sm font-[family-name:var(--font-syne)] font-semibold uppercase tracking-wider text-muted-foreground">
            Core Details
          </h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="title"
            className="text-sm font-[family-name:var(--font-outfit)] font-medium"
          >
            Hypercert Name *
          </Label>
          <Input
            id="title"
            onChange={(e) => setTitle(e.target.value)}
            value={title}
            placeholder="Enter the hypercert name"
            required
            className="font-[family-name:var(--font-outfit)]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="description"
            className="text-sm font-[family-name:var(--font-outfit)] font-medium"
          >
            Short Description *
          </Label>
          <Textarea
            onChange={(e) => setShortDescription(e.target.value)}
            id="description"
            value={shortDescription}
            placeholder="Enter a short description"
            required
            className="font-[family-name:var(--font-outfit)] min-h-[100px]"
          />
        </div>
      </div>

      {/* ── Section: Rights ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-lg bg-create-accent/10 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-create-accent" />
          </div>
          <h3 className="text-sm font-[family-name:var(--font-syne)] font-semibold uppercase tracking-wider text-muted-foreground">
            Rights
          </h3>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/30 p-5 space-y-4">
          <p className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground">
            Rights information is required to create a Hypercert.
          </p>
          <HypercertRightsFields value={rights} onChange={setRights} />
        </div>
      </div>

      {/* ── Section: Background Image ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-lg bg-create-accent/10 flex items-center justify-center">
            <Upload className="h-3.5 w-3.5 text-create-accent" />
          </div>
          <h3 className="text-sm font-[family-name:var(--font-syne)] font-semibold uppercase tracking-wider text-muted-foreground">
            Background Image
          </h3>
        </div>

        <label
          htmlFor="background-image"
          className="relative flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-create-accent/40 transition-all duration-200 cursor-pointer group overflow-hidden"
        >
          {imagePreview ? (
            <>
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover opacity-60 group-hover:opacity-40 transition-opacity"
              />
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Upload className="h-5 w-5 text-foreground/70" />
                <span className="text-xs font-[family-name:var(--font-outfit)] text-foreground/70">
                  Click to change image
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-create-accent/10 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground group-hover:text-create-accent transition-colors" />
              </div>
              <div className="text-center">
                <span className="text-sm font-[family-name:var(--font-outfit)] font-medium text-muted-foreground">
                  Drop image here or click to upload
                </span>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  PNG, JPG, WebP up to 5MB
                </p>
              </div>
            </div>
          )}
          <Input
            id="background-image"
            onChange={handleImageChange}
            type="file"
            accept="image/*"
            className="sr-only"
          />
        </label>
      </div>

      {/* ── Section: Work Scope ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-lg bg-create-accent/10 flex items-center justify-center">
            <Tag className="h-3.5 w-3.5 text-create-accent" />
          </div>
          <h3 className="text-sm font-[family-name:var(--font-syne)] font-semibold uppercase tracking-wider text-muted-foreground">
            Work Scope
          </h3>
        </div>

        <div id="workScope" className="flex flex-wrap gap-2">
          {workScope.map((value, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <Input
                value={value}
                onChange={(e) => handleWorkScopeChange(index, e.target.value)}
                placeholder="Enter a tag"
                required={index === 0}
                className="w-40 font-[family-name:var(--font-outfit)] text-sm h-9"
              />
              {workScope.length > 1 && index !== 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWorkScopeField(index)}
                  aria-label="Remove tag"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </Button>
              ) : null}
              {!!workScope[index] && index === workScope.length - 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addWorkScopeField}
                  aria-label="Add another work scope tag"
                  className="h-9 w-9"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* ── Section: Work Timeframe ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-lg bg-create-accent/10 flex items-center justify-center">
            <Calendar className="h-3.5 w-3.5 text-create-accent" />
          </div>
          <h3 className="text-sm font-[family-name:var(--font-syne)] font-semibold uppercase tracking-wider text-muted-foreground">
            Work Timeframe
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DatePicker
              initDate={startDate || undefined}
              onChange={setStartDate}
              label="From"
            />
          </div>
          <div>
            <DatePicker
              initDate={endDate || undefined}
              onChange={setEndDate}
              label="To"
            />
          </div>
        </div>
      </div>

      {/* ── Section: Contributors (Optional, Collapsible) ── */}
      <div className="space-y-4">
        <button
          type="button"
          className="flex items-center justify-between w-full group"
          onClick={() => setShowContributions(!showContributions)}
        >
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-create-accent/10 flex items-center justify-center">
              <UsersIcon className="h-3.5 w-3.5 text-create-accent" />
            </div>
            <h3 className="text-sm font-[family-name:var(--font-syne)] font-semibold uppercase tracking-wider text-muted-foreground">
              Contributors
            </h3>
            <span className="text-[11px] font-[family-name:var(--font-outfit)] text-muted-foreground/60 ml-1">
              Optional
            </span>
          </div>
          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
            {showContributions ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {showContributions ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-5 animate-fade-in-up">
            <div className="space-y-2">
              <Label
                htmlFor="contribution-role"
                className="text-sm font-[family-name:var(--font-outfit)] font-medium"
              >
                Role / Title
              </Label>
              <Input
                id="contribution-role"
                placeholder="e.g., Developer, Designer, Researcher"
                value={contributionRole}
                onChange={(e) => setContributionRole(e.target.value)}
                maxLength={100}
                className="font-[family-name:var(--font-outfit)]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-[family-name:var(--font-outfit)] font-medium">
                Contributors
              </Label>
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
                        className="font-[family-name:var(--font-outfit)]"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeManualContributor(index)}
                        disabled={manualContributors.length === 1}
                        type="button"
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
                    type="button"
                    className="gap-2 font-[family-name:var(--font-outfit)]"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add Contributor
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="contribution-description"
                className="text-sm font-[family-name:var(--font-outfit)] font-medium"
              >
                Contribution Description (Optional)
              </Label>
              <Textarea
                id="contribution-description"
                placeholder="What the contribution concretely achieved..."
                value={contributionDescription}
                onChange={(e) => setContributionDescription(e.target.value)}
                maxLength={2000}
                rows={4}
                className="font-[family-name:var(--font-outfit)]"
              />
              <p className="text-[11px] font-[family-name:var(--font-outfit)] text-muted-foreground">
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

            {hasContributors && !contributionRole.trim() ? (
              <p className="text-sm text-amber-600 font-[family-name:var(--font-outfit)]">
                Please enter a role for the contributors
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ── Actions ── */}
      {!!updateActions ? (
        <div className="flex items-center justify-between gap-4 pt-6 mt-2 border-t border-border/50">
          <div />
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="outline"
              disabled={isSaving}
              aria-label="Save"
              className="font-[family-name:var(--font-outfit)]"
            >
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving && buttonClicked === "create"
                ? "Creating..."
                : "Create"}
            </Button>

            <Button
              type="button"
              disabled={!hypercertUri || isSaving}
              onClick={next}
              aria-label="Save and go to Contributions"
              className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-medium min-w-[120px]"
            >
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving && buttonClicked === "saveNext"
                ? "Creating..."
                : "Next"}
            </Button>
          </div>
        </div>
      ) : null}

      {!updateActions ? (
        <Button
          disabled={saveDisabled || isSaving}
          type="submit"
          className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-medium"
        >
          {isSaving ? <Spinner /> : null}
          {isSaving ? "Creating Hypercert" : "Create Hypercert"}
        </Button>
      ) : null}
    </form>
  );
}
