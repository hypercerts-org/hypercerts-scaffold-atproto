"use client";

import { DatePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { useState } from "react";
import { toast } from "sonner";

import * as HypercertRecord from "@/lexicons/types/org/hypercerts/claim";

type HypercertDetailsFormProps = {
  hypercertId: string;
  initialRecord?: HypercertRecord.Record;
  onSaved?: (args: { advance: boolean }) => void;
};

export default function HypercertDetailsForm({
  hypercertId,
  initialRecord,
  onSaved,
}: HypercertDetailsFormProps) {
  const { atProtoAgent } = useOAuthContext();
  const [title, setTitle] = useState(initialRecord?.title || "");
  const [shortDescription, setShortDescription] = useState(
    initialRecord?.shortDescription || ""
  );
  const [workScope, setWorkScope] = useState(initialRecord?.workScope || "");
  const [workTimeframeFrom, setWorkTimeframeFrom] = useState<Date | null>(
    initialRecord?.workTimeFrameFrom
      ? new Date(initialRecord.workTimeFrameFrom)
      : null
  );
  const [workTimeframeTo, setWorkTimeframeTo] = useState<Date | null>(
    initialRecord?.workTimeFrameTo
      ? new Date(initialRecord.workTimeFrameTo)
      : null
  );

  const [saving, setSaving] = useState(false);

  async function saveRecord({ advance }: { advance: boolean }) {
    if (!atProtoAgent) return;

    try {
      setSaving(true);
      if (
        !workTimeframeFrom ||
        !workTimeframeTo ||
        !title ||
        !shortDescription ||
        !workScope ||
        !initialRecord?.createdAt
      ) {
        return;
      }

      const record: HypercertRecord.Record = {
        ...(initialRecord || {}),
        $type: "org.hypercerts.claim",
        title,
        shortDescription,
        workScope,
        workTimeFrameFrom: workTimeframeFrom.toISOString(),
        workTimeFrameTo: workTimeframeTo.toISOString(),
      };

      if (
        HypercertRecord.isRecord(record) &&
        HypercertRecord.validateRecord(record).success
      ) {
        await atProtoAgent.com.atproto.repo.putRecord({
          repo: atProtoAgent.assertDid,
          collection: "org.hypercerts.claim",
          rkey: hypercertId,
          record,
        });
        toast.success("Hypercert saved");
        onSaved?.({ advance });
      } else {
        const validation = HypercertRecord.validateRecord(record);
        if (!validation.success) {
          toast.error(validation.error.message);
        } else {
          toast.error("Invalid hypercert data, please check your inputs.");
        }
      }
    } catch (error) {
      console.error("Error updating hypercert:", error);
      toast.error(
        error instanceof Error ? error?.message : "Failed to update hypercert"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveRecord({ advance: false });
      }}
      className="flex flex-col gap-4 max-w-2xl mx-auto"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="title">Hypercert Name</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter the hypercert name"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="description">Short Description</Label>
        <Textarea
          id="description"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Enter a short description"
          required
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="workScope">Work Scope Tags</Label>
        <Textarea
          id="workScope"
          value={workScope}
          onChange={(e) => setWorkScope(e.target.value)}
          placeholder="Enter tags that describe the work"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DatePicker
          initDate={workTimeframeFrom ?? undefined}
          onChange={setWorkTimeframeFrom}
          label="Work Time Frame From"
        />
        <DatePicker
          initDate={workTimeframeTo ?? undefined}
          onChange={setWorkTimeframeTo}
          label="Work Time Frame To"
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button
          type="submit"
          variant="outline"
          disabled={saving}
          aria-label="Save"
        >
          {saving && <Spinner className="mr-2" />}
          {saving ? "Saving…" : "Save"}
        </Button>

        <Button
          type="button"
          disabled={saving}
          onClick={() => saveRecord({ advance: true })}
          aria-label="Save and go to Contributions"
        >
          {saving && <Spinner className="mr-2" />}
          {saving ? "Saving…" : "Save & Next"}
        </Button>
      </div>
    </form>
  );
}
