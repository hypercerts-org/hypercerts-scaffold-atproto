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
    <div className="gradient-mesh relative overflow-hidden rounded-2xl">
      {/* Noise overlay */}
      <div className="noise-bg relative">
        <div className="relative z-10 px-8 py-12 text-center lg:py-16">
          {/* Animated success icon */}
          <div className="animate-scale-in mb-6 inline-flex items-center justify-center">
            <div className="relative">
              <div className="bg-create-accent/15 flex h-20 w-20 items-center justify-center rounded-2xl">
                <svg
                  className="text-create-accent h-10 w-10"
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
              <div className="bg-create-accent/10 absolute inset-0 -z-10 rounded-2xl blur-xl" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-foreground animate-fade-in-up mb-2 font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight lg:text-3xl">
            Hypercert Created
          </h2>
          <p
            className="text-muted-foreground animate-fade-in-up mx-auto mb-8 max-w-md font-[family-name:var(--font-outfit)] text-sm"
            style={{ animationDelay: "100ms" }}
          >
            Your impact claim is now live. Share it, view the details, or create
            another one.
          </p>

          {/* CID display */}
          {hypercertInfo?.hypercertCid ? (
            <div
              className="glass-panel animate-fade-in-up mb-8 inline-block rounded-xl px-5 py-3"
              style={{ animationDelay: "200ms" }}
            >
              <p className="text-muted-foreground mb-1 font-[family-name:var(--font-outfit)] text-[11px] font-medium tracking-wider uppercase">
                Content Identifier
              </p>
              <p className="text-foreground max-w-lg font-mono text-xs break-all">
                {hypercertInfo.hypercertCid}
              </p>
            </div>
          ) : null}

          {!hypercertInfo?.hypercertCid ? (
            <p
              className="text-muted-foreground animate-fade-in-up mb-8 font-[family-name:var(--font-outfit)] text-sm"
              style={{ animationDelay: "200ms" }}
            >
              We couldn&apos;t resolve a specific hypercert ID, but your record
              should now be available in your hypercerts list.
            </p>
          ) : null}

          {/* Actions */}
          <div
            className="animate-fade-in-up flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "300ms" }}
          >
            {onBack ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground gap-2 font-[family-name:var(--font-outfit)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : null}

            {hypercertInfo?.hypercertCid ? (
              <Link href={viewHref}>
                <Button className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground gap-2 font-[family-name:var(--font-outfit)] font-medium shadow-sm">
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
