"use client";

import { URILink } from "./uri-link";
import { getPDSlsURI } from "@/lib/utils";

import dynamic from "next/dynamic";
import type { HypercertClaim } from "@hypercerts-org/sdk-core";
import {
  MeasurementsSectionSkeleton,
  EvidenceSectionSkeleton,
  EvaluationsSectionSkeleton,
} from "./detail-view-skeletons";
import HypercertContributorsSection from "./hypercert-contributors-section";
import { Calendar, Clock, Link as LinkIcon } from "lucide-react";
import Image from "next/image";

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
}: {
  hypercertUri: string;
  record: HypercertClaim;
  imageUri?: string;
}) {
  const workScope = Array.isArray(record.workScope) ? record.workScope : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- contributors field exists on record but not in HypercertClaim type yet
  const rawContributors = (record as any).contributors;
  const contributors = Array.isArray(rawContributors)
    ? rawContributors
    : undefined;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="animate-fade-in-up space-y-4">
        {/* Hero Image */}
        {imageUri ? (
          <div className="glass-panel border-border/50 relative aspect-[16/7] overflow-hidden rounded-xl border">
            <Image
              fill
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
        <HypercertContributorsSection contributors={contributors} />
      </div>

      {/* Full Description */}
      {record.description ? (
        <div className="animate-fade-in-up [animation-delay:250ms]">
          <div className="glass-panel border-border/50 space-y-3 rounded-xl border p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
              Description
            </h2>
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm leading-relaxed whitespace-pre-wrap">
              {record.description}
            </p>
          </div>
        </div>
      ) : null}

      {/* Sections */}
      <div className="animate-fade-in-up space-y-6 [animation-delay:350ms]">
        <HypercertMeasurementsSection hypercertUri={hypercertUri} />
        <HypercertEvidenceSection hypercertUri={hypercertUri} />
        <HypercertEvaluationsSection hypercertUri={hypercertUri} />
      </div>
    </div>
  );
}
