"use client";

import { DatePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import * as Hypercert from "@/lexicons/types/org/hypercerts/claim/activity";
import { Label } from "@radix-ui/react-label";
import { PlusIcon, XIcon } from "lucide-react";
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
  logo?: File;
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
  const initialWorkScope = certInfo?.workScope
    .split(",")
    .map((scope) => scope.trim());
  const [title, setTitle] = useState(certInfo?.title || "");
  const [backgroundImage, setBackgroundImage] = useState<File | undefined>();
  const [shortDescription, setShortDescription] = useState(
    certInfo?.shortDescription || ""
  );
  const [buttonClicked, setButtonClicked] = useState<"saveNext" | "create">();
  const [workScope, setWorkScope] = useState<string[]>(
    initialWorkScope || [""]
  );
  const [workTimeframeFrom, setWorkTimeframeFrom] = useState<Date | null>(
    certInfo?.workTimeFrameFrom ? new Date(certInfo?.workTimeFrameFrom) : null
  );
  const [workTimeframeTo, setWorkTimeframeTo] = useState<Date | null>(
    certInfo?.workTimeFrameTo ? new Date(certInfo?.workTimeFrameTo) : null
  );

  const handleWorkScopeChange = (index: number, value: string) => {
    setWorkScope((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const addWorkScopeField = () => {
    setWorkScope((prev) => [...prev, ""]);
  };

  const removeWorkScopeField = (index: number) => {
    setWorkScope((prev) => prev.filter((_, idx) => idx !== index));
  };

  const getRecord = (): HypercertRecordForm | undefined => {
    const cleanedWorkScope = workScope
      .map((w) => w.trim())
      .filter(Boolean)
      .join(",");

    if (
      !(
        title &&
        shortDescription &&
        cleanedWorkScope &&
        workTimeframeFrom &&
        workTimeframeTo
      )
    ) {
      return;
    }

    const record: HypercertRecordForm = {
      title,
      shortDescription,
      workScope: cleanedWorkScope,
      image: backgroundImage,
      workTimeFrameFrom: workTimeframeFrom.toISOString(),
      workTimeFrameTo: workTimeframeTo.toISOString(),
      createdAt: new Date().toISOString(),
    };
    return record;
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setButtonClicked("create");
    const record = getRecord();
    if (!record) return;
    onSave?.(record, false);
  };

  const handleSaveAndContinue = () => {
    setButtonClicked("saveNext");
    const record = getRecord();
    if (!record) return;
    onSave?.(record, true);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Label htmlFor="title">Hypercert Name</Label>
        <Input
          id="title"
          onChange={(e) => setTitle(e.target.value)}
          value={title}
          placeholder="Enter the hypercert name"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="description">Short Description</Label>
        <Textarea
          onChange={(e) => setShortDescription(e.target.value)}
          id="description"
          value={shortDescription}
          placeholder="Enter a short description"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="background-image" aria-required>
          Background Image *
        </Label>
        <Input
          id="background-image"
          onChange={(e) => setBackgroundImage(e.target.files?.[0])}
          type="file"
          placeholder="Add Background Image"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="workScope">Work Scope Tags</Label>
        <div id="workScope" className="flex w-full flex-col gap-2">
          {workScope.map((value, index) => (
            <div key={index} className="flex w-full justify-between gap-2">
              <Input
                value={value}
                onChange={(e) => handleWorkScopeChange(index, e.target.value)}
                placeholder="Enter a tag"
                required={index === 0}
              />
              {workScope.length > 1 && index !== 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size={"icon"}
                  onClick={() => removeWorkScopeField(index)}
                  aria-label="Remove tag"
                >
                  <XIcon />
                </Button>
              )}
              {!!workScope[index] && index === workScope.length - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size={"icon"}
                  onClick={addWorkScopeField}
                  aria-label="Add another work scope tag"
                >
                  <PlusIcon />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <DatePicker
            initDate={workTimeframeFrom || undefined}
            onChange={setWorkTimeframeFrom}
            label="Work Time Frame From"
          />
        </div>
        <div>
          <DatePicker
            initDate={workTimeframeTo || undefined}
            onChange={setWorkTimeframeTo}
            label="Work Time Frame To"
          />
        </div>
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
            {isSaving && buttonClicked === "create" ? "Creating…" : "Create"}
          </Button>

          <Button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndContinue}
            aria-label="Save and go to Contributions"
          >
            {isSaving && <Spinner className="mr-2" />}
            {isSaving && buttonClicked === "saveNext"
              ? "Creating…"
              : "Create & Next"}
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
