"use client";

import { URILink } from "./uri-link";
import { getPDSlsURI, linearDocumentToString } from "@/lib/utils";

import dynamic from "next/dynamic";
import { OrgHypercertsClaimActivity } from "@hypercerts-org/lexicon";
import {
  MeasurementsSectionSkeleton,
  EvidenceSectionSkeleton,
  EvaluationsSectionSkeleton,
} from "./detail-view-skeletons";
import HypercertContributorsSection from "./hypercert-contributors-section";
import {
  Calendar,
  Clock,
  Link as LinkIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeleteHypercertMutation } from "@/queries/hypercerts";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";

const HypercertMeasurementsSection = dynamic(
  () => import("./hypercert-measurements-section"),
  { loading: () => <MeasurementsSectionSkeleton /> },
);
const HypercertEvidenceSection = dynamic(
  () => import("./hypercert-evidence-section"),
  { loading: () => <EvidenceSectionSkeleton /> },
);
const HypercertEvaluationsSection = dynamic(
  () => import("./hypercert-evaluations-section"),
  { loading: () => <EvaluationsSectionSkeleton /> },
);

export default function HypercertDetailsView({
  hypercertUri,
  record,
  imageUri,
  isOwner,
}: {
  hypercertUri: string;
  record: OrgHypercertsClaimActivity.Record;
  imageUri?: string;
  isOwner?: boolean;
}) {
  const router = useRouter();
  const deleteMutation = useDeleteHypercertMutation({
    onSuccess: () => {
      router.push("/hypercerts");
    },
  });
  let workScope: string[] = [];
  if (
    record.workScope &&
    OrgHypercertsClaimActivity.isWorkScopeString(record.workScope)
  ) {
    workScope = record.workScope.scope
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  const contributors = Array.isArray(record.contributors)
    ? record.contributors
    : undefined;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="animate-fade-in-up space-y-4">
        {/* Owner Actions */}
        {isOwner && (
          <div className="flex items-center justify-end gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 font-[family-name:var(--font-outfit)]"
            >
              <Link
                href={`/hypercerts/${encodeURIComponent(hypercertUri)}/edit`}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
            <DeleteConfirmDialog
              itemType="hypercert"
              itemName={record.title}
              isDeleting={deleteMutation.isPending}
              onConfirm={() => deleteMutation.mutate({ hypercertUri })}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Delete hypercert"
                  className="text-destructive hover:text-destructive gap-2 font-[family-name:var(--font-outfit)]"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              }
            />
          </div>
        )}

        {/* Hero Image */}
        {imageUri ? (
          <div className="glass-panel border-border/50 relative aspect-[16/7] overflow-hidden rounded-xl border">
            <Image
              fill
              unoptimized
              alt={record.title || "Hypercert cover"}
              src={imageUri}
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ) : null}

        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight md:text-4xl">
            {record.title || "Untitled"}
          </h1>
          {record.shortDescription ? (
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-lg">
              {record.shortDescription}
            </p>
          ) : null}
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="animate-fade-in-up [animation-delay:100ms]">
        <div className="glass-panel border-border/50 space-y-4 rounded-xl border p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Created At */}
            <div className="flex items-start gap-3">
              <div className="bg-create-accent/10 flex size-10 shrink-0 items-center justify-center rounded-full">
                <Calendar className="text-create-accent size-5" />
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                  Created
                </dt>
                <dd className="font-[family-name:var(--font-outfit)] text-sm font-medium">
                  {record.createdAt
                    ? new Date(record.createdAt).toLocaleString()
                    : "—"}
                </dd>
              </div>
            </div>

            {/* Work Period */}
            <div className="flex items-start gap-3">
              <div className="bg-create-accent/10 flex size-10 shrink-0 items-center justify-center rounded-full">
                <Clock className="text-create-accent size-5" />
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                  Work Period
                </dt>
                <dd className="font-[family-name:var(--font-outfit)] text-sm font-medium">
                  {record.startDate && record.endDate ? (
                    <>
                      {new Date(record.startDate).toLocaleDateString()} →{" "}
                      {new Date(record.endDate).toLocaleDateString()}
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </div>

            {/* URI */}
            <div className="flex items-start gap-3 md:col-span-2">
              <div className="bg-create-accent/10 flex size-10 shrink-0 items-center justify-center rounded-full">
                <LinkIcon className="text-create-accent size-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <dt className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                  Hypercert URI
                </dt>
                <dd className="font-[family-name:var(--font-outfit)] text-sm break-all">
                  <URILink
                    uri={getPDSlsURI(hypercertUri)}
                    label={hypercertUri}
                  />
                </dd>
              </div>
            </div>
          </div>

          {/* Work Scope Tags */}
          {workScope.length > 0 ? (
            <div className="border-border/50 border-t pt-4">
              <dt className="text-muted-foreground mb-2 font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                Work Scope
              </dt>
              <dd className="flex flex-wrap gap-2">
                {workScope.map((scope: string) => (
                  <span
                    key={scope}
                    className="bg-create-accent/10 text-create-accent border-create-accent/20 inline-flex items-center rounded-full border px-3 py-1 font-[family-name:var(--font-outfit)] text-sm"
                  >
                    {scope}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </div>
      </div>

      {/* Contributors Section */}
      <div className="animate-fade-in-up [animation-delay:150ms]">
        <HypercertContributorsSection
          contributors={contributors}
          hypercertUri={hypercertUri}
          isOwner={isOwner}
        />
      </div>

      {/* Full Description */}
      {record.description ? (
        <div className="animate-fade-in-up [animation-delay:250ms]">
          <div className="glass-panel border-border/50 space-y-3 rounded-xl border p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
              Description
            </h2>
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm leading-relaxed whitespace-pre-wrap">
              {linearDocumentToString(record.description)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Sections */}
      <div className="animate-fade-in-up space-y-6 [animation-delay:350ms]">
        <HypercertMeasurementsSection
          hypercertUri={hypercertUri}
          isOwner={isOwner}
        />
        <HypercertEvidenceSection
          hypercertUri={hypercertUri}
          isOwner={isOwner}
        />
        <HypercertEvaluationsSection
          hypercertUri={hypercertUri}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
