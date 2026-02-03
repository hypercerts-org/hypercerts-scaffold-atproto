"use client";

import { getPDSlsURI } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { URILink } from "./uri-link";

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{measurement.metric}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-2xl font-bold">{measurement.value}</div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">Measured On</dt>
            <dd suppressHydrationWarning>
              {new Date(measurement.createdAt).toLocaleString()}
            </dd>
          </div>

          {measurement.measurementMethodURI && (
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">Methodology</dt>
              <dd className="break-all">
                <URILink
                  label={measurement.measurementMethodURI}
                  uri={getPDSlsURI(measurement.measurementMethodURI)}
                />
              </dd>
            </div>
          )}

          <div className="space-y-1 md:col-span-2">
            <dt className="text-xs text-muted-foreground">Measurers</dt>
            <dd>
              <ul className="list-disc list-inside">
                {measurement.measurers.map((measurer, index) => {
                  const did = typeof measurer === "object" ? measurer.did : measurer;
                  return (
                    <li key={index} className="break-all">
                      <URILink
                        uri={`https://bsky.app/profile/${did}`}
                        label={did}
                      />
                    </li>
                  );
                })}
              </ul>
            </dd>
          </div>

          {measurement.evidenceURI && measurement.evidenceURI.length > 0 && (
            <div className="space-y-1 md:col-span-2">
              <dt className="text-xs text-muted-foreground">Evidence</dt>
              <dd>
                <ul className="list-disc list-inside">
                  {measurement.evidenceURI.map((uri, index) => (
                    <li key={index} className="break-all">
                      <URILink label={uri} uri={uri?.includes("https") ? uri : getPDSlsURI(uri)} />
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
