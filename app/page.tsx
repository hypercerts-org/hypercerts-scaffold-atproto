"use client";

import { DatePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";
import { Label } from "@radix-ui/react-label";
import { FormEventHandler, useState } from "react";
import * as HypercertRecord from "@/lexicons/types/org/hypercerts/claim/record";

export default function Home() {
  const { atProtoAgent, session } = useOAuthContext();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [shortDescription, setShortDescription] = useState("");
  const [workScope, setWorkScope] = useState("");
  const [workTimeframeFrom, setWorkTimeframeFrom] = useState<Date | null>(null);
  const [workTimeframeTo, setWorkTimeframeTo] = useState<Date | null>(null);

  const handleSubmit: FormEventHandler = async (e) => {
    e.preventDefault();
    if (!atProtoAgent || !session) return;

    const blob = new Blob([file!], { type: file?.type });
    const response = await atProtoAgent.com.atproto.repo.uploadBlob(blob);
    const uploadedBlob = response.data.blob;
    const record = {
      $type: "org.hypercerts.claim.record",
      title,
      shortDescription,
      workScope,
      image: { $type: "smallBlob", ...uploadedBlob },
      workTimeframeFrom: workTimeframeFrom?.toISOString() || null,
      workTimeFrameTo: workTimeframeTo?.toISOString() || null,
      createdAt: new Date().toISOString(),
    };
    if (
      HypercertRecord.isRecord(record) &&
      HypercertRecord.validateRecord(record).success
    ) {
      console.log({
        title,
        shortDescription,
        workScope,
        workTimeframeFrom,
        workTimeframeTo,
      });
      await atProtoAgent.com.atproto.repo.createRecord({
        rkey: new Date().getTime().toString(),
        record,
        collection: "org.hypercerts.claim.record",
        repo: atProtoAgent.assertDid,
      });
    } else {
      console.log("isRecord", HypercertRecord.isRecord(record));
      console.log(HypercertRecord.validateRecord(record));
      console.log("validation failed");
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
          onChange={setWorkTimeframeFrom}
          label="Work Time Frame From"
        />
        <DatePicker onChange={setWorkTimeframeTo} label="Work Time Frame To" />
      </div>
      <Button type="submit">Create Hypercert</Button>
    </form>
  );
}
