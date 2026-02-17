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

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="animate-fade-in-up space-y-4">
        {/* Hero Image */}
        {imageUri ? (
          <div className="relative aspect-[16/7] rounded-xl overflow-hidden glass-panel border border-border/50">
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
          <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-syne)] font-bold tracking-tight">
            {record.title || "Untitled"}
          </h1>
          {record.shortDescription ? (
            <p className="text-lg font-[family-name:var(--font-outfit)] text-muted-foreground">
              {record.shortDescription}
            </p>
          ) : null}
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="animate-fade-in-up [animation-delay:100ms]">
        <div className="glass-panel rounded-xl p-6 border border-border/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Created At */}
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center shrink-0">
                <Calendar className="size-5 text-create-accent" />
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider">
                  Created
                </dt>
                <dd className="text-sm font-[family-name:var(--font-outfit)] font-medium">
                  {record.createdAt
                    ? new Date(record.createdAt).toLocaleString()
                    : "—"}
                </dd>
              </div>
            </div>

            {/* Work Period */}
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center shrink-0">
                <Clock className="size-5 text-create-accent" />
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider">
                  Work Period
                </dt>
                <dd className="text-sm font-[family-name:var(--font-outfit)] font-medium">
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
              <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center shrink-0">
                <LinkIcon className="size-5 text-create-accent" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider">
                  Hypercert URI
                </dt>
                <dd className="text-sm font-[family-name:var(--font-outfit)] break-all">
                  <URILink
                    uri={getPDSlsURI(hypercertUri)}
                    label={hypercertUri}
                  />
                </dd>
              </div>
            </div>
          </div>

          {/* Work Scope Tags */}
          {workScope.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider mb-2">
                Work Scope
              </dt>
              <dd className="flex flex-wrap gap-2">
                {workScope.map((scope: string) => (
                  <span
                    key={scope}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-[family-name:var(--font-outfit)] bg-create-accent/10 text-create-accent border border-create-accent/20"
                  >
                    {scope}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </div>
      </div>

      {/* Full Description */}
      {record.description ? (
        <div className="animate-fade-in-up [animation-delay:200ms]">
          <div className="glass-panel rounded-xl p-6 border border-border/50 space-y-3">
            <h2 className="text-lg font-[family-name:var(--font-syne)] font-semibold">
              Description
            </h2>
            <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {record.description}
            </p>
          </div>
        </div>
      ) : null}

      {/* Sections */}
      <div className="animate-fade-in-up [animation-delay:300ms] space-y-6">
        <HypercertMeasurementsSection hypercertUri={hypercertUri} />
        <HypercertEvidenceSection hypercertUri={hypercertUri} />
        <HypercertEvaluationsSection hypercertUri={hypercertUri} />
      </div>
    </div>
  );
}
