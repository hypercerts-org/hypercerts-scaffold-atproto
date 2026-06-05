"use client";

import { useState, FormEventHandler } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useUpdateHypercertMutation } from "@/queries/hypercerts";
import { addContribution } from "@/lib/create-actions";
import { localDateToAtprotoDatetime } from "@/lib/datetime";
import {
  CONTRIBUTION_WEIGHT_PATTERN,
  isValidContributionWeight,
} from "@/lib/contribution-validation";
import type { OrgHypercertsClaimActivity } from "@hypercerts-org/lexicon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/date-range-picker";
import { Label } from "@radix-ui/react-label";
import { Upload, Tag, Calendar, X, Users, PlusIcon, Trash } from "lucide-react";

interface HypercertsEditFormProps {
  hypercertUri: string;
  record: OrgHypercertsClaimActivity.Record;
  imageUri?: string;
}

export default function HypercertsEditForm({
  hypercertUri,
  record,
  imageUri,
}: HypercertsEditFormProps) {
  const parseRecordDate = (raw: string | undefined): Date | null => {
    if (!raw) return null;

    const datePartMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
    if (datePartMatch) {
      const year = Number(datePartMatch[1]);
      const month = Number(datePartMatch[2]);
      const day = Number(datePartMatch[3]);
      return new Date(year, month - 1, day);
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const router = useRouter();
  const encodedUri = encodeURIComponent(hypercertUri);
  const detailHref = `/hypercerts/${encodedUri}`;

  const [title, setTitle] = useState(record.title ?? "");
  const [shortDescription, setShortDescription] = useState(
    record.shortDescription ?? "",
  );
  const [startDate, setStartDate] = useState<Date | null>(
    parseRecordDate(record.startDate),
  );
  const [endDate, setEndDate] = useState<Date | null>(
    parseRecordDate(record.endDate),
  );
  const [newImage, setNewImage] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(
    imageUri ?? null,
  );
  // true when the user explicitly wants to remove the existing image
  const [removeImage, setRemoveImage] = useState(false);
  const [manualContributors, setManualContributors] = useState<string[]>([""]);
  const [contributionRole, setContributionRole] = useState("");
  const [contributionWeight, setContributionWeight] = useState("");
  const [contributionDescription, setContributionDescription] = useState("");
  const [contributionStartDate, setContributionStartDate] =
    useState<Date | null>(null);
  const [contributionEndDate, setContributionEndDate] = useState<Date | null>(
    null,
  );
  const [isAddingContribution, setIsAddingContribution] = useState(false);

  const updateMutation = useUpdateHypercertMutation();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);
      const maxBytes = 5 * 1024 * 1024;
      if (!allowed.has(file.type)) {
        toast.error("Please upload a PNG, JPG, or WebP image.");
        e.currentTarget.value = "";
        return;
      }
      if (file.size > maxBytes) {
        toast.error("Image must be 5 MB or smaller.");
        e.currentTarget.value = "";
        return;
      }
    }
    setNewImage(file);
    setRemoveImage(false);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(imageUri ?? null);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewImage(undefined);
    setRemoveImage(true);
    setImagePreview(null);
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

  const getManualContributorIdentifiers = (): string[] => {
    return manualContributors
      .map((identifier) => identifier.trim())
      .filter((identifier) => identifier !== "");
  };

  // Normalize a Date to a date-only string "YYYY-MM-DD" using local time,
  // avoiding UTC conversion that can shift the calendar day.
  const toDateString = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Normalize the record's date field to "YYYY-MM-DD" regardless of whether
  // it was stored as a date-only string or a full ISO string.
  const recordDateString = (raw: string | undefined | null): string => {
    if (!raw) return "";
    // Date-only string — return as-is.
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    // ISO string with time component — extract date portion from the string directly
    // (avoids timezone-dependent local extraction via new Date()).
    const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})T/);
    if (isoMatch) return isoMatch[1];
    // Fallback for other formats (unusual) — local extraction.
    const d = new Date(raw);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const isCorePristine =
    title === (record.title ?? "") &&
    shortDescription === (record.shortDescription ?? "") &&
    (startDate ? toDateString(startDate) : "") ===
      recordDateString(record.startDate) &&
    (endDate ? toDateString(endDate) : "") ===
      recordDateString(record.endDate) &&
    !newImage &&
    !removeImage;

  const contributorIdentifiers = getManualContributorIdentifiers();
  const hasNewContributors = contributorIdentifiers.length > 0;
  const isContributionWeightValid =
    isValidContributionWeight(contributionWeight);
  const hasContributionDraft =
    hasNewContributors ||
    contributionRole.trim() !== "" ||
    contributionWeight.trim() !== "" ||
    contributionDescription.trim() !== "" ||
    contributionStartDate !== null ||
    contributionEndDate !== null;
  const canSaveContribution =
    hasNewContributors &&
    contributionRole.trim() !== "" &&
    isContributionWeightValid;
  const isPristine = isCorePristine && !hasContributionDraft;
  const isSaving = updateMutation.isPending || isAddingContribution;

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    // Guard: nothing changed — show feedback and bail out
    if (isPristine) {
      toast.info("No changes to save.");
      return;
    }

    if (hasContributionDraft && !canSaveContribution) {
      toast.error(
        "To add contributors, enter at least one identifier, a role/title, and a positive weight if provided.",
      );
      return;
    }

    // Build updates with only changed fields
    const updates: Parameters<typeof updateMutation.mutateAsync>[0] = {
      hypercertUri,
    };

    if (title !== (record.title ?? "")) updates.title = title;
    if (shortDescription !== (record.shortDescription ?? ""))
      updates.shortDescription = shortDescription;

    const nextStart = startDate ? toDateString(startDate) : "";
    const prevStart = recordDateString(record.startDate);
    if (nextStart !== prevStart) {
      updates.startDate = startDate
        ? localDateToAtprotoDatetime(startDate, "startDate")
        : null;
    }

    const nextEnd = endDate ? toDateString(endDate) : "";
    const prevEnd = recordDateString(record.endDate);
    if (nextEnd !== prevEnd) {
      updates.endDate = endDate
        ? localDateToAtprotoDatetime(endDate, "endDate")
        : null;
    }
    if (removeImage) updates.image = null;
    else if (newImage) updates.image = newImage;

    try {
      if (!isCorePristine) {
        await updateMutation.mutateAsync(updates);
      }

      if (hasContributionDraft) {
        setIsAddingContribution(true);
        await addContribution({
          hypercertUri,
          contributors: contributorIdentifiers,
          weight: contributionWeight.trim() || undefined,
          contributionDetails: {
            role: contributionRole.trim(),
            contributionDescription:
              contributionDescription.trim() || undefined,
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
        });
        toast.success("Contributor added to hypercert.");
      }

      router.push(detailHref);
    } catch (error) {
      console.error("Save hypercert failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save hypercert.",
      );
    } finally {
      setIsAddingContribution(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel border-border/50 space-y-8 rounded-2xl border p-8"
    >
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
            Hypercert Name
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter the hypercert name"
            maxLength={256}
            className="font-[family-name:var(--font-outfit)]"
          />
          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
            {title.length} / 256 characters
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="shortDescription"
            className="font-[family-name:var(--font-outfit)] text-sm font-medium"
          >
            Short Description
          </Label>
          <Textarea
            id="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Enter a short description"
            maxLength={300}
            className="min-h-[100px] font-[family-name:var(--font-outfit)]"
          />
          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
            {shortDescription.length} / 300 characters
          </p>
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
              initDate={startDate ?? undefined}
              onChange={setStartDate}
              label="From"
            />
          </div>
          <div>
            <DatePicker
              initDate={endDate ?? undefined}
              onChange={setEndDate}
              label="To"
            />
          </div>
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

        <div className="relative">
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
          {imagePreview && (
            <button
              type="button"
              onClick={handleRemoveImage}
              aria-label="Remove image"
              className="bg-background/80 text-destructive hover:bg-destructive hover:text-destructive-foreground border-border/50 absolute top-2 right-2 z-20 flex items-center gap-1 rounded-md border px-2 py-1 font-[family-name:var(--font-outfit)] text-xs shadow-sm transition-colors"
            >
              <X className="h-3 w-3" />
              Remove image
            </button>
          )}
        </div>
      </div>

      {/* ── Section: Contributors ── */}
      <div className="space-y-4">
        <div className="mb-1 flex items-center gap-2">
          <div className="bg-create-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
            <Users className="text-create-accent h-3.5 w-3.5" />
          </div>
          <h3 className="text-muted-foreground font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wider uppercase">
            Add Contributors
          </h3>
          <span className="text-muted-foreground/60 ml-1 font-[family-name:var(--font-outfit)] text-[11px]">
            Optional
          </span>
        </div>

        <div className="border-border/60 bg-muted/20 space-y-5 rounded-xl border p-5">
          <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs">
            Append contributor details to this hypercert. Use an org domain like
            govtech.bt, a website, DID, AT-URI, or social profile URL.
          </p>

          <div className="space-y-2">
            <Label
              htmlFor="contribution-role"
              className="font-[family-name:var(--font-outfit)] text-sm font-medium"
            >
              Role / Title
            </Label>
            <Input
              id="contribution-role"
              placeholder="e.g., Implementation partner, Funder, Reviewer"
              value={contributionRole}
              onChange={(e) => setContributionRole(e.target.value)}
              maxLength={100}
              disabled={isSaving}
              className="font-[family-name:var(--font-outfit)]"
            />
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
              {contributionRole.length} / 100 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-[family-name:var(--font-outfit)] text-sm font-medium">
              Contributor Identifiers
            </Label>
            {manualContributors.map((identifier, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="govtech.bt, jaggle.ai, did:plc:..., https://..."
                  value={identifier}
                  onChange={(e) =>
                    updateManualContributor(index, e.target.value)
                  }
                  disabled={isSaving}
                  className="font-[family-name:var(--font-outfit)]"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeManualContributor(index)}
                  disabled={manualContributors.length === 1 || isSaving}
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
              disabled={isSaving}
              type="button"
              className="gap-2 font-[family-name:var(--font-outfit)]"
            >
              <PlusIcon className="h-3.5 w-3.5" /> Add Identifier
            </Button>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="contribution-weight"
              className="font-[family-name:var(--font-outfit)] text-sm font-medium"
            >
              Contribution Weight (Optional)
            </Label>
            <Input
              id="contribution-weight"
              type="text"
              inputMode="decimal"
              pattern={CONTRIBUTION_WEIGHT_PATTERN}
              title="Use a positive number like 1, 0.5, or 25."
              placeholder="e.g., 1, 0.5, 25"
              value={contributionWeight}
              onChange={(e) => setContributionWeight(e.target.value)}
              maxLength={100}
              disabled={isSaving}
              className="font-[family-name:var(--font-outfit)]"
            />
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
              Relative contribution weight. Values do not need to add up to 100.
            </p>
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
              disabled={isSaving}
              className="font-[family-name:var(--font-outfit)]"
            />
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-[11px]">
              {contributionDescription.length} / 1000 characters
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DatePicker
              label="Contribution Started"
              initDate={contributionStartDate ?? undefined}
              onChange={setContributionStartDate}
            />
            <DatePicker
              label="Contribution Finished"
              initDate={contributionEndDate ?? undefined}
              onChange={setContributionEndDate}
            />
          </div>

          {hasNewContributors && !contributionRole.trim() ? (
            <p className="font-[family-name:var(--font-outfit)] text-sm text-amber-600">
              Please enter a role for the contributors.
            </p>
          ) : null}
          {!isContributionWeightValid ? (
            <p className="font-[family-name:var(--font-outfit)] text-sm text-amber-600">
              Contribution weight must be a positive number like 1, 0.5, or 25.
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="border-border/50 mt-2 flex items-center justify-between gap-4 border-t pt-6">
        <Button
          asChild
          variant="ghost"
          className="text-muted-foreground font-[family-name:var(--font-outfit)]"
        >
          <Link href={detailHref}>Cancel</Link>
        </Button>

        <Button
          type="submit"
          disabled={isSaving || isPristine}
          className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground min-w-[140px] font-[family-name:var(--font-outfit)] font-medium"
        >
          {isSaving ? <Spinner className="mr-2" /> : null}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
