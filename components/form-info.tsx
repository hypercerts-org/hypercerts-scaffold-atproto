"use client";

import { ReactNode } from "react";

export default function FormInfo({
  title,
  description,
  stepLabel,
  children,
}: {
  title: string;
  description?: string;
  stepLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="glass-panel overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="border-border/50 border-b px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            {stepLabel && (
              <span className="bg-create-accent/10 text-create-accent mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 font-[family-name:var(--font-outfit)] text-[11px] font-medium tracking-wider uppercase">
                {stepLabel}
              </span>
            )}
            <h2 className="text-foreground font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight lg:text-2xl">
              {title}
            </h2>
            {description && (
              <p className="text-muted-foreground mt-1 max-w-lg font-[family-name:var(--font-outfit)] text-sm">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="stagger-children">{children}</div>
      </div>
    </div>
  );
}
