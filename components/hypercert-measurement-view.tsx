"use client";

import React from "react";
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
  actions,
}: {
  measurement?: Measurement;
  actions?: React.ReactNode;
}) {
  if (!measurement) {
    return null;
  }

  const measurers = Array.isArray(measurement.measurers)
    ? measurement.measurers
    : [];

  return (
    <Card className="glass-panel border-border/50 overflow-hidden rounded-xl border">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="min-w-0 flex-1 font-[family-name:var(--font-syne)] text-lg">
            {measurement.metric}
          </CardTitle>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Value Display */}
        <div className="bg-create-accent/10 border-create-accent/20 inline-flex items-center rounded-lg border px-4 py-3">
          <span className="text-create-accent font-[family-name:var(--font-syne)] text-3xl font-bold">
            {measurement.value}
          </span>
        </div>

        {/* Metadata Grid */}
        <dl className="space-y-4">
          {/* Measured On */}
          <div className="flex items-start gap-3">
            <Calendar className="text-create-accent mt-0.5 size-4 shrink-0" />
            <div className="flex-1 space-y-1">
              <dt className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                Measured On
              </dt>
              <dd
                className="font-[family-name:var(--font-outfit)] text-sm"
                suppressHydrationWarning
              >
                {new Date(measurement.createdAt).toLocaleString()}
              </dd>
            </div>
          </div>

          {/* Methodology */}
          {measurement.measurementMethodURI ? (
            <div className="flex items-start gap-3">
              <FileText className="text-create-accent mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <dt className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                  Methodology
                </dt>
                <dd className="font-[family-name:var(--font-outfit)] text-sm break-all">
                  <URILink
                    label={measurement.measurementMethodURI}
                    uri={getPDSlsURI(measurement.measurementMethodURI)}
                  />
                </dd>
              </div>
            </div>
          ) : null}

          {/* Measurers */}
          <div className="flex items-start gap-3">
            <Users className="text-create-accent mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <dt className="text-muted-foreground font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                Measurers
              </dt>
              <dd className="space-y-1">
                {measurers.length > 0 ? (
                  measurers.map((measurer, index) => {
                    const did =
                      typeof measurer === "object" ? measurer.did : measurer;
                    return (
                      <div
                        key={index}
                        className="font-[family-name:var(--font-outfit)] text-sm break-all"
                      >
                        <URILink
                          uri={`https://bsky.app/profile/${did}`}
                          label={did}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
                    No measurers listed
                  </div>
                )}
              </dd>
            </div>
          </div>

          {/* Evidence */}
          {measurement.evidenceURI && measurement.evidenceURI.length > 0 ? (
            <div className="border-border/50 border-t pt-4">
              <dt className="text-muted-foreground mb-2 font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase">
                Evidence
              </dt>
              <dd className="space-y-1">
                {measurement.evidenceURI.map((uri, index) => (
                  <div
                    key={index}
                    className="font-[family-name:var(--font-outfit)] text-sm break-all"
                  >
                    <URILink
                      label={uri}
                      uri={uri?.startsWith("https") ? uri : getPDSlsURI(uri)}
                    />
                  </div>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
