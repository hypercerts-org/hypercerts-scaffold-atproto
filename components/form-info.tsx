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
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            {stepLabel && (
              <span className="inline-flex items-center rounded-full bg-create-accent/10 px-2.5 py-0.5 text-[11px] font-[family-name:var(--font-outfit)] font-medium text-create-accent uppercase tracking-wider mb-2">
                {stepLabel}
              </span>
            )}
            <h2 className="text-xl lg:text-2xl font-[family-name:var(--font-syne)] font-bold tracking-tight text-foreground">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm font-[family-name:var(--font-outfit)] text-muted-foreground max-w-lg">
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
