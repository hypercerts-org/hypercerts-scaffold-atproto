"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import useDebounce from "@/lib/use-debounce";
import { CheckIcon, XIcon } from "lucide-react";
import { useCheckHandleQuery } from "@/queries/organizations";

export interface OrganizationFormParams {
  name: string;
  handlePrefix: string;
  description: string;
}

export interface OrganizationFormProps {
  isCreating: boolean;
  onSubmit: (params: OrganizationFormParams) => void;
}

export default function OrganizationForm({
  isCreating,
  onSubmit,
}: OrganizationFormProps) {
  const [name, setName] = useState("");
  const [handlePrefix, setHandlePrefix] = useState("");
  const [description, setDescription] = useState("");
  const debouncedHandle = useDebounce(handlePrefix, 500);

  const sdsUrl = process.env.NEXT_PUBLIC_SDS_URL?.replace(/^https?:\/\//, "") || "";

  const {
    data: handleAvailable,
    isLoading: isCheckingHandle,
    error,
  } = useCheckHandleQuery(debouncedHandle, sdsUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handleAvailable) {
      onSubmit({ name, handlePrefix, description });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Label htmlFor="name">Organization Name *</Label>
        <Input
          id="name"
          onChange={(e) => setName(e.target.value)}
          value={name}
          placeholder="Enter the organization name"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="handle">Organization Handle *</Label>
        <div className="relative">
          <Input
            id="handle"
            onChange={(e) => setHandlePrefix(e.target.value)}
            value={handlePrefix}
            placeholder="Enter the organization handle"
            required
            disabled={isCheckingHandle}
            className="pr-10"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isCheckingHandle ? (
              <Spinner />
            ) : handleAvailable === true ? (
              <CheckIcon className="text-green-500" />
            ) : handleAvailable === false ? (
              <XIcon className="text-red-500" />
            ) : null}
          </div>
        </div>
        {handleAvailable === false && (
          <p className="text-red-500 text-sm mt-1">Handle not available</p>
        )}
        {handlePrefix && handleAvailable && (
          <p className="text-sm mt-1">
            <span className="text-gray-600">Your full handle will be : </span>
            <span className="text-gray-500">
              {handlePrefix}.{sdsUrl}
            </span>
          </p>
        )}
        {error && (
          <p className="text-red-500 text-sm mt-1">
            {(error as Error).message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          placeholder="Enter a description"
        />
      </div>

      <Button
        disabled={isCreating || isCheckingHandle || !handleAvailable}
        type="submit"
      >
        {isCreating ? <Spinner /> : null}
        {isCreating ? "Creating Organization..." : "Create Organization"}
      </Button>
    </form>
  );
}
