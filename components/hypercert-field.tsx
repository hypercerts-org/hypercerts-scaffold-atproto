"use client";

import { ReactNode } from "react";

export function LabelSmall({ children }: { children: ReactNode }) {
  return <div className="text-xs text-muted-foreground mb-1">{children}</div>;
}

export function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <LabelSmall>{label}</LabelSmall>
      <p className={`text-sm ${mono ? "font-mono break-all" : ""}`}>{value}</p>
    </div>
  );
}
