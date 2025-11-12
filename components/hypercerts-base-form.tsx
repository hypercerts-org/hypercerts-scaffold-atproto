"use client";

import { DatePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import * as Hypercert from "@/lexicons/types/org/hypercerts/claim";
import { Label } from "@radix-ui/react-label";
import { FormEventHandler, useState } from "react";

export interface HypercertsBaseFormProps {
  isSaving: boolean;
  saveDisabled: boolean;
  onSave?: (record: HypercertRecordForm, advance?: boolean) => void;
  updateActions?: boolean;
  certInfo?: Hypercert.Record;
}

export interface HypercertRecordForm {
  title: string;
  shortDescription: string;
  workScope: string;
  image?: File;
  workTimeFrameFrom: string;
  workTimeFrameTo: string;
  createdAt: string;
}

export default function HypercertsBaseForm({
  isSaving,
  saveDisabled,
  onSave,
  updateActions,
  certInfo,
}: HypercertsBaseFormProps) {
  const [title, setTitle] = useState(certInfo?.title || "");
  const [file, setFile] = useState<File | undefined>();
  const [shortDescription, setShortDescription] = useState(
    certInfo?.shortDescription || ""
  );
  const [workScope, setWorkScope] = useState(certInfo?.workScope);
  const [workTimeframeFrom, setWorkTimeframeFrom] = useState<Date | null>(
    certInfo?.workTimeFrameFrom ? new Date(certInfo?.workTimeFrameFrom) : null
  );
  const [workTimeframeTo, setWorkTimeframeTo] = useState<Date | null>(
    certInfo?.workTimeFrameTo ? new Date(certInfo?.workTimeFrameTo) : null
  );

  const getRecord = () => {
    if (
      !(
        title &&
        shortDescription &&
        workScope &&
        workTimeframeFrom &&
        workTimeframeTo
      )
    ) {
      return;
    }
    const record = {
      title,
      shortDescription,
      workScope,
      image: file,
      workTimeFrameFrom: workTimeframeFrom.toISOString(),
      workTimeFrameTo: workTimeframeTo.toISOString(),
      createdAt: new Date().toISOString(),
    };
    return record;
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const record = getRecord();
    if (!record) return;
    onSave?.(record, false);
  };
  const handleSaveAndContinue = () => {
    const record = getRecord();
    if (!record) return;
    onSave?.(record, true);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-md mx-auto py-10"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="title">Hypercert Name</Label>
        <Input
          id="title"
          onChange={(e) => setTitle(e.target.value)}
          value={title}
          placeholder="Enter the hypercert name"
          required
        ></Input>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="description">Short Description</Label>
        <Textarea
          onChange={(e) => setShortDescription(e.target.value)}
          id="description"
          value={shortDescription}
          placeholder="Enter a short description"
          required
        ></Textarea>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="short-description">Background Image</Label>
        <Input
          onChange={(e) => setFile(e.target.files?.[0])}
          type="file"
          placeholder="Add Background Image"
          required
        ></Input>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="workScope">Work Scope Tags</Label>
        <Textarea
          onChange={(e) => setWorkScope(e.target.value)}
          value={workScope}
          id="workScope"
          placeholder="Enter tags that describe the work"
          required
        ></Textarea>
      </div>
      <div className="flex justify-between w-full">
        <DatePicker
          initDate={workTimeframeFrom || undefined}
          onChange={setWorkTimeframeFrom}
          label="Work Time Frame From"
        />
        <DatePicker
          initDate={workTimeframeTo || undefined}
          onChange={setWorkTimeframeTo}
          label="Work Time Frame To"
        />
      </div>
      {!!updateActions && (
        <div className="flex gap-3 justify-end pt-2">
          <Button
            type="submit"
            variant="outline"
            disabled={isSaving}
            aria-label="Save"
          >
            {isSaving && <Spinner className="mr-2" />}
            {isSaving ? "Saving…" : "Save"}
          </Button>

          <Button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndContinue}
            aria-label="Save and go to Contributions"
          >
            {isSaving && <Spinner className="mr-2" />}
            {isSaving ? "Saving…" : "Save & Next"}
          </Button>
        </div>
      )}
      {!updateActions && (
        <Button disabled={saveDisabled || isSaving} type="submit">
          {isSaving && <Spinner />}
          {isSaving ? "Creating Hypercert" : "Create Hypercert"}
        </Button>
      )}
    </form>
  );
}
