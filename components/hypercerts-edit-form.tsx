"use client";

import { useState, FormEventHandler } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useUpdateHypercertMutation } from "@/queries/hypercerts";
import type { OrgHypercertsClaimActivity } from "@hypercerts-org/lexicon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/date-range-picker";
import { Label } from "@radix-ui/react-label";
import { Upload, Tag, Calendar, X } from "lucide-react";

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
  const router = useRouter();
  const encodedUri = encodeURIComponent(hypercertUri);
  const detailHref = `/hypercerts/${encodedUri}`;

  const [title, setTitle] = useState(record.title ?? "");
  const [shortDescription, setShortDescription] = useState(
    record.shortDescription ?? "",
  );
  const [startDate, setStartDate] = useState<Date | null>(
    record.startDate ? new Date(record.startDate) : null,
  );
  const [endDate, setEndDate] = useState<Date | null>(
    record.endDate ? new Date(record.endDate) : null,
  );
  const [newImage, setNewImage] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(
    imageUri ?? null,
  );
  // true when the user explicitly wants to remove the existing image
  const [removeImage, setRemoveImage] = useState(false);

  const updateMutation = useUpdateHypercertMutation({
    onSuccess: () => {
      router.push(detailHref);
    },
  });

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

  const isPristine =
    title === (record.title ?? "") &&
    shortDescription === (record.shortDescription ?? "") &&
    (startDate ? toDateString(startDate) : "") ===
      recordDateString(record.startDate) &&
    (endDate ? toDateString(endDate) : "") ===
      recordDateString(record.endDate) &&
    !newImage &&
    !removeImage;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    // Guard: nothing changed — show feedback and bail out
    if (isPristine) {
      toast.info("No changes to save.");
      return;
    }

    // Build updates with only changed fields
    const updates: Parameters<typeof updateMutation.mutate>[0] = {
      hypercertUri,
    };

    if (title !== (record.title ?? "")) updates.title = title;
    if (shortDescription !== (record.shortDescription ?? ""))
      updates.shortDescription = shortDescription;

    const nextStart = startDate ? toDateString(startDate) : "";
    const prevStart = recordDateString(record.startDate);
    if (nextStart !== prevStart) {
      updates.startDate = nextStart || null;
    }

    const nextEnd = endDate ? toDateString(endDate) : "";
    const prevEnd = recordDateString(record.endDate);
    if (nextEnd !== prevEnd) {
      updates.endDate = nextEnd || null;
    }
    if (removeImage) updates.image = null;
    else if (newImage) updates.image = newImage;

    updateMutation.mutate(updates);
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
          disabled={updateMutation.isPending || isPristine}
          className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground min-w-[140px] font-[family-name:var(--font-outfit)] font-medium"
        >
          {updateMutation.isPending ? <Spinner className="mr-2" /> : null}
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
