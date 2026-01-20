"use client";

import { Separator } from "@/components/ui/separator";
import { URILink } from "./uri-link";
import { getPDSlsURI } from "@/lib/utils";

import HypercertMeasurementsSection from "./hypercert-measurements-section";
import type { HypercertClaim } from "@hypercerts-org/sdk-core";
import HypercertEvaluationsSection from "./hypercert-evaluations-section";
import HypercertEvidenceSection from "./hypercert-evidence-section";

export default function HypercertDetailsView({
  hypercertUri,
  record,
  imageUri,
}: {
  hypercertUri: string;
  record: HypercertClaim;
  imageUri?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {record.title || "Untitled"}
          </h2>
        </div>

        {record.shortDescription ? (
          <p className="text-sm text-muted-foreground mt-1">
            {record.shortDescription}
          </p>
        ) : null}
      </div>

      <Separator />

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* hide scope for now depending on how we should display it */}
        {/* <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">Work Scope</dt>
          <dd className="text-sm flex gap-2 flex-wrap">
            {workScope.length ? (
              workScope.map((scope) => <Badge key={scope}>{scope}</Badge>)
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </dd>
        </div> */}

        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">Created At</dt>
          <dd className="text-sm">
            {record.createdAt
              ? new Date(record.createdAt).toLocaleString()
              : "—"}
          </dd>
        </div>

        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">
            Work Timeframe (From)
          </dt>
          <dd className="text-sm">
            {record.startDate
              ? new Date(record.startDate).toLocaleDateString()
              : "—"}
          </dd>
        </div>

        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">Work Timeframe (To)</dt>
          <dd className="text-sm">
            {record.endDate
              ? new Date(record.endDate).toLocaleDateString()
              : "—"}
          </dd>
        </div>

        <div className="space-y-1 md:col-span-2">
          <dt className="text-xs text-muted-foreground">URI</dt>
          <dd className="text-sm break-all">
            <URILink uri={getPDSlsURI(hypercertUri)} label={hypercertUri} />
          </dd>
        </div>

        {!!imageUri && (
          <div className="space-y-1 md:col-span-2">
            <dt className="text-xs text-muted-foreground">Image URI</dt>
            <dd className="text-sm break-all">
              <URILink uri={imageUri} label={imageUri || ""} />
            </dd>
          </div>
        )}

        {record.description ? (
          <div className="space-y-1 md:col-span-2">
            <dt className="text-xs text-muted-foreground">Description</dt>
            <dd className="text-sm whitespace-pre-wrap">
              {record.description}
            </dd>
          </div>
        ) : null}
      </dl>

      <HypercertMeasurementsSection hypercertUri={hypercertUri} />
      <HypercertEvidenceSection hypercertUri={hypercertUri} />
      <HypercertEvaluationsSection hypercertUri={hypercertUri} />
    </div>
  );
}
