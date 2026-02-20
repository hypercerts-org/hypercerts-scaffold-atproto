"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, ExternalLink } from "lucide-react";
import { BaseHypercertFormProps } from "@/lib/types";

export default function HypercertCompletionStep({
  hypercertInfo,
  onBack,
  onCreateAnother,
}: BaseHypercertFormProps & {
  onBack?: () => void;
  onCreateAnother?: () => void;
}) {
  const viewHref = hypercertInfo?.hypercertUri
    ? `/hypercerts/${encodeURIComponent(hypercertInfo.hypercertUri)}`
    : "/hypercerts";

  return (
    <div className="relative overflow-hidden rounded-2xl gradient-mesh">
      {/* Noise overlay */}
      <div className="noise-bg relative">
        <div className="relative z-10 px-8 py-12 lg:py-16 text-center">
          {/* Animated success icon */}
          <div className="inline-flex items-center justify-center mb-6 animate-scale-in">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-create-accent/15 flex items-center justify-center">
                <svg
                  className="h-10 w-10 text-create-accent"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline
                    points="20 6 9 17 4 12"
                    className="animate-draw-check"
                  />
                </svg>
              </div>
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl bg-create-accent/10 blur-xl -z-10" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl lg:text-3xl font-[family-name:var(--font-syne)] font-bold tracking-tight text-foreground mb-2 animate-fade-in-up">
            Hypercert Created
          </h2>
          <p
            className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground max-w-md mx-auto mb-8 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            Your impact claim is now live. Share it, view the details, or create
            another one.
          </p>

          {/* CID display */}
          {hypercertInfo?.hypercertCid ? (
            <div
              className="inline-block glass-panel rounded-xl px-5 py-3 mb-8 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              <p className="text-[11px] uppercase tracking-wider font-[family-name:var(--font-outfit)] font-medium text-muted-foreground mb-1">
                Content Identifier
              </p>
              <p className="font-mono text-xs text-foreground break-all max-w-lg">
                {hypercertInfo.hypercertCid}
              </p>
            </div>
          ) : null}

          {!hypercertInfo?.hypercertCid ? (
            <p
              className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground mb-8 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              We couldn&apos;t resolve a specific hypercert ID, but your record
              should now be available in your hypercerts list.
            </p>
          ) : null}

          {/* Actions */}
          <div
            className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            {onBack ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className="gap-2 font-[family-name:var(--font-outfit)] text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : null}

            {hypercertInfo?.hypercertCid ? (
              <Link href={viewHref}>
                <Button className="gap-2 bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-medium shadow-sm">
                  <ExternalLink className="h-4 w-4" />
                  View Hypercert
                </Button>
              </Link>
            ) : null}

            {onCreateAnother ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2 font-[family-name:var(--font-outfit)]"
                onClick={onCreateAnother}
              >
                <Plus className="h-4 w-4" />
                Create Another
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
