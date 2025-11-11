"use client";

import { DatePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { Label } from "@radix-ui/react-label";
import { FormEventHandler, useState } from "react";
import * as HypercertRecord from "@/lexicons/types/org/hypercerts/claim";
import { BlobRef } from "@atproto/lexicon";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function Home() {
  const { atProtoAgent, session } = useOAuthContext();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [shortDescription, setShortDescription] = useState("");
  const [workScope, setWorkScope] = useState("");
  const [workTimeframeFrom, setWorkTimeframeFrom] = useState<Date | null>(null);
  const [workTimeframeTo, setWorkTimeframeTo] = useState<Date | null>(null);
  const [creating, setCreating] = useState(false);

  const handleSubmit: FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      if (!atProtoAgent || !session) return;
      setCreating(true);
      let uploadedBlob: BlobRef | null = null;
      if (file) {
        const blob = new Blob([file!], { type: file?.type });
        const response = await atProtoAgent.com.atproto.repo.uploadBlob(blob);
        uploadedBlob = response.data.blob;
      }
      const record = {
        $type: "org.hypercerts.claim",
        title,
        shortDescription,
        workScope,
        image: uploadedBlob ? { $type: "smallBlob", ...uploadedBlob } : null,
        workTimeFrameFrom: workTimeframeFrom?.toISOString() || null,
        workTimeFrameTo: workTimeframeTo?.toISOString() || null,
        createdAt: new Date().toISOString(),
      };
      if (
        HypercertRecord.isRecord(record) &&
        HypercertRecord.validateRecord(record).success
      ) {
        await atProtoAgent.com.atproto.repo.createRecord({
          rkey: new Date().getTime().toString(),
          record,
          collection: "org.hypercerts.claim",
          repo: atProtoAgent.assertDid,
        });
        toast.success("Hypercert created successfully!");
      } else {
        const validation = HypercertRecord.validateRecord(record);
        if (!validation.success) {
          toast.error(validation.error.message);
        } else {
          toast.error("Invalid hypercert data, please check your inputs.");
        }
      }
    } catch (error) {
      console.error("Error creating hypercert:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create hypercert please try again"
      );
    } finally {
      setCreating(false);
    }
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
          placeholder="Enter the hypercert name"
          required
        ></Input>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="description">Short Description</Label>
        <Textarea
          onChange={(e) => setShortDescription(e.target.value)}
          id="description"
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
      <Button disabled={creating} type="submit">
        {creating && <Spinner />}
        {creating ? "Creating Hypercert" : "Create Hypercert"}
      </Button>
    </form>
  );
}
