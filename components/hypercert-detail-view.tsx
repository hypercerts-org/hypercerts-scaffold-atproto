"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { HypercertRecordData } from "@/lib/types";
import { Link2, LinkIcon } from "lucide-react";
import Link from "next/link";

export default function HypercertDetailsView({
  hypercertData,
}: {
  hypercertData: HypercertRecordData;
}) {
  const record = hypercertData.value;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {record.title || "Untitled"}
          </h2>
          <Badge variant="outline">View Only</Badge>
        </div>
        {record.shortDescription ? (
          <p className="text-sm text-muted-foreground mt-1">
            {record.shortDescription}
          </p>
        ) : null}
      </div>

      <Separator />

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">Work Scope</dt>
          <dd className="text-sm">
            {Array.isArray(record.workScope) && record.workScope.length
              ? record.workScope.join(", ")
              : "—"}
          </dd>
        </div>

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
            {record.workTimeFrameFrom
              ? new Date(record.workTimeFrameFrom).toLocaleDateString()
              : "—"}
          </dd>
        </div>

        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">Work Timeframe (To)</dt>
          <dd className="text-sm">
            {record.workTimeFrameTo
              ? new Date(record.workTimeFrameTo).toLocaleDateString()
              : "—"}
          </dd>
        </div>

        <div className="space-y-1 md:col-span-2">
          <dt className="text-xs text-muted-foreground">URI</dt>
          <dd className="text-sm break-all">
            <Link target="_blank" rel="noreferrer nooopener" className="flex gap-2 items-center hover:text-blue-400 hover:underline" href={`https://pdsls.dev/${hypercertData.uri}`}>
              {hypercertData.uri || "—"}
              <LinkIcon size={18} />
            </Link>
          </dd>
        </div>

        <div className="space-y-1 md:col-span-2">
          <dt className="text-xs text-muted-foreground">CID</dt>
          <dd className="text-sm break-all">{hypercertData.cid || "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
