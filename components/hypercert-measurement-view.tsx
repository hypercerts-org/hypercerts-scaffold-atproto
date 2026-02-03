"use client";

import { getPDSlsURI } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { URILink } from "./uri-link";
import { Calendar, FileText, Users } from "lucide-react";

export interface Measurement {
  value: string;
  metric: string;
  createdAt: string;
  measurers: (string | { did: string })[];
  evidenceURI?: string[];
  measurementMethodURI?: string;
}

export default function HypercertMeasurementView({
  measurement,
}: {
  measurement?: Measurement;
}) {
  if (!measurement) {
    return null;
  }
  return (
    <Card className="glass-panel rounded-xl border border-border/50 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-[family-name:var(--font-syne)]">
          {measurement.metric}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Value Display */}
        <div className="inline-flex items-center px-4 py-3 rounded-lg bg-create-accent/10 border border-create-accent/20">
          <span className="text-3xl font-[family-name:var(--font-syne)] font-bold text-create-accent">
            {measurement.value}
          </span>
        </div>

        {/* Metadata Grid */}
        <dl className="space-y-4">
          {/* Measured On */}
          <div className="flex items-start gap-3">
            <Calendar className="size-4 text-create-accent shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider">
                Measured On
              </dt>
              <dd className="text-sm font-[family-name:var(--font-outfit)]" suppressHydrationWarning>
                {new Date(measurement.createdAt).toLocaleString()}
              </dd>
            </div>
          </div>

          {/* Methodology */}
          {measurement.measurementMethodURI && (
            <div className="flex items-start gap-3">
              <FileText className="size-4 text-create-accent shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1 min-w-0">
                <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider">
                  Methodology
                </dt>
                <dd className="text-sm font-[family-name:var(--font-outfit)] break-all">
                  <URILink
                    label={measurement.measurementMethodURI}
                    uri={getPDSlsURI(measurement.measurementMethodURI)}
                  />
                </dd>
              </div>
            </div>
          )}

          {/* Measurers */}
          <div className="flex items-start gap-3">
            <Users className="size-4 text-create-accent shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1 min-w-0">
              <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider">
                Measurers
              </dt>
              <dd className="space-y-1">
                {measurement.measurers.map((measurer, index) => {
                  const did = typeof measurer === "object" ? measurer.did : measurer;
                  return (
                    <div key={index} className="text-sm font-[family-name:var(--font-outfit)] break-all">
                      <URILink
                        uri={`https://bsky.app/profile/${did}`}
                        label={did}
                      />
                    </div>
                  );
                })}
              </dd>
            </div>
          </div>

          {/* Evidence */}
          {measurement.evidenceURI && measurement.evidenceURI.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <dt className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground uppercase tracking-wider mb-2">
                Evidence
              </dt>
              <dd className="space-y-1">
                {measurement.evidenceURI.map((uri, index) => (
                  <div key={index} className="text-sm font-[family-name:var(--font-outfit)] break-all">
                    <URILink label={uri} uri={uri?.includes("https") ? uri : getPDSlsURI(uri)} />
                  </div>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
