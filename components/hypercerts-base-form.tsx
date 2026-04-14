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
import { OrgHypercertsClaimActivity } from "@hypercerts-org/lexicon";
import type { CreateHypercertParams } from "@/lib/types";
import { localDateToAtprotoDatetime } from "@/lib/datetime";
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
  certInfo?: OrgHypercertsClaimActivity.Main;
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
  const initialWorkScope =
    certInfo?.workScope &&
    OrgHypercertsClaimActivity.isWorkScopeString(certInfo.workScope)
      ? certInfo.workScope.scope.split(",").map((scope: string) => scope.trim())
      : undefined;
  const [title, setTitle] = useState(certInfo?.title || "");
  const [backgroundImage, setBackgroundImage] = useState<File | undefined>();
  const [shortDescription, setShortDescription] = useState(
    certInfo?.shortDescription || "",
  );
  const [buttonClicked, setButtonClicked] = useState<"create">();
  const [workScope, setWorkScope] = useState<string[]>(
    initialWorkScope || [""],
  );
  const [startDate, setStartDate] = useState<Date | null>(
    certInfo?.startDate ? new Date(certInfo.startDate) : null,
  );
  const [endDate, setEndDate] = useState<Date | null>(
    certInfo?.endDate ? new Date(certInfo.endDate) : null,
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
            startDate: contributionStartDate
              ? localDateToAtprotoDatetime(
                  contributionStartDate,
                  "contribution startDate",
                )
              : undefined,
            endDate: contributionEndDate
              ? localDateToAtprotoDatetime(
                  contributionEndDate,
                  "contribution endDate",
                )
              : undefined,
          },
        },
      ];
    }

    const record: CreateHypercertParams = {
      title,
      shortDescription,
      rights: {
        rightsName: rights.name.trim(),
        rightsType: rights.type.trim(),
        rightsDescription: rights.description.trim(),
      },
      description: shortDescription,
      image: backgroundImage,
      startDate: localDateToAtprotoDatetime(startDate, "startDate"),
      endDate: localDateToAtprotoDatetime(endDate, "endDate"),
      contributions,
      workScope: workScope.filter((s) => s.trim()),
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
          className="gap-2 font-[family-name:var(--font-outfit)] text-xs"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Autofill Demo
        </Button>
      </div>

      {/* ── Section: Core Details ── */}
      <div className="space-y-5">
        <div className="mb-1 flex items-center gap-2">
          <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
            <Tag className="text-create-accent h-3.5 w-3.5" />
          </div>
          <h3 className="text-muted-foreground font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wider uppercase">
            Core Details
          </h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="title"
            className="font-[family-name:var(--font-outfit)] text-sm font-medium"
          >
            Hypercert Name *
          </Label>
          <Input
            id="title"
            onChange={(e) => setTitle(e.target.value)}
            value={title}
            placeholder="Enter the hypercert name"
            maxLength={256}
            required
            className="font-[family-name:var(--font-outfit)]"
          />
          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
            {title.length} / 256 characters
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="description"
            className="font-[family-name:var(--font-outfit)] text-sm font-medium"
          >
            Short Description *
          </Label>
          <Textarea
            onChange={(e) => setShortDescription(e.target.value)}
            id="description"
            value={shortDescription}
            placeholder="Enter a short description"
            maxLength={300}
            required
            className="min-h-[100px] font-[family-name:var(--font-outfit)]"
          />
          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
            {shortDescription.length} / 300 characters
          </p>
        </div>
      </div>

      {/* ── Section: Rights ── */}
      <div className="space-y-4">
        <div className="mb-1 flex items-center gap-2">
          <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
            <Shield className="text-create-accent h-3.5 w-3.5" />
          </div>
          <h3 className="text-muted-foreground font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wider uppercase">
            Rights
          </h3>
        </div>
        <div className="border-border/60 bg-muted/30 space-y-4 rounded-xl border p-5">
          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs">
            Rights information is required to create a Hypercert.
          </p>
          <HypercertRightsFields value={rights} onChange={setRights} />
        </div>
      </div>

      {/* ── Section: Background Image ── */}
      <div className="space-y-3">
        <div className="mb-1 flex items-center gap-2">
          <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
            <Upload className="text-create-accent h-3.5 w-3.5" />
          </div>
          <h3 className="text-muted-foreground font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wider uppercase">
            Background Image
          </h3>
        </div>

        <label
          htmlFor="background-image"
          className="border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-create-accent/40 group relative flex h-36 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200"
        >
          {imagePreview ? (
            <>
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                unoptimized
                className="object-cover opacity-60 transition-opacity group-hover:opacity-40"
              />
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Upload className="text-foreground/70 h-5 w-5" />
                <span className="text-foreground/70 font-[family-name:var(--font-outfit)] text-xs">
                  Click to change image
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="bg-muted group-hover:bg-create-accent/10 flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
                <Upload className="text-muted-foreground group-hover:text-create-accent h-5 w-5 transition-colors" />
              </div>
              <div className="text-center">
                <span className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm font-medium">
                  Drop image here or click to upload
                </span>
                <p className="text-muted-foreground/60 mt-0.5 text-[11px]">
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
        <div className="mb-1 flex items-center gap-2">
          <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
            <Tag className="text-create-accent h-3.5 w-3.5" />
          </div>
          <h3 className="text-muted-foreground font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wider uppercase">
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
                maxLength={100}
                required={index === 0}
                className="h-9 w-40 font-[family-name:var(--font-outfit)] text-sm"
              />
              {workScope.length > 1 && index !== 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWorkScopeField(index)}
                  aria-label="Remove tag"
                  className="text-muted-foreground hover:text-destructive h-9 w-9"
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
        <div className="mb-1 flex items-center gap-2">
          <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
            <Calendar className="text-create-accent h-3.5 w-3.5" />
          </div>
          <h3 className="text-muted-foreground font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wider uppercase">
            Work Timeframe
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          className="group flex w-full items-center justify-between"
          onClick={() => setShowContributions(!showContributions)}
        >
          <div className="flex items-center gap-2">
            <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
              <UsersIcon className="text-create-accent h-3.5 w-3.5" />
            </div>
            <h3 className="text-muted-foreground font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wider uppercase">
              Contributors
            </h3>
            <span className="text-muted-foreground/60 ml-1 font-[family-name:var(--font-outfit)] text-[11px]">
              Optional
            </span>
          </div>
          <div className="bg-muted group-hover:bg-muted/80 flex h-7 w-7 items-center justify-center rounded-lg transition-colors">
            {showContributions ? (
              <ChevronUp className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            )}
          </div>
        </button>

        {showContributions ? (
          <div className="border-border/60 bg-muted/20 animate-fade-in-up space-y-5 rounded-xl border p-5">
            <div className="space-y-2">
              <Label
                htmlFor="contribution-role"
                className="font-[family-name:var(--font-outfit)] text-sm font-medium"
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
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
                {contributionRole.length} / 100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-[family-name:var(--font-outfit)] text-sm font-medium">
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
                        className="border-border/60 bg-background/50 flex items-center justify-between gap-4 rounded-lg border p-3"
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
                className="font-[family-name:var(--font-outfit)] text-sm font-medium"
              >
                Contribution Description (Optional)
              </Label>
              <Textarea
                id="contribution-description"
                placeholder="What the contribution concretely achieved..."
                value={contributionDescription}
                onChange={(e) => setContributionDescription(e.target.value)}
                maxLength={1000}
                rows={4}
                className="font-[family-name:var(--font-outfit)]"
              />
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
                {contributionDescription.length} / 1000 characters
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <p className="font-[family-name:var(--font-outfit)] text-sm text-amber-600">
                Please enter a role for the contributors
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ── Actions ── */}
      {!!updateActions ? (
        <div className="border-border/50 mt-2 flex items-center justify-between gap-4 border-t pt-6">
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
              className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground min-w-[120px] font-[family-name:var(--font-outfit)] font-medium"
            >
              Next
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
