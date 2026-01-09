"use client";

import { useState } from "react";
import { toast } from "sonner";
import OrganizationForm, {
  OrganizationFormParams,
} from "@/components/organization-form";
import FormInfo from "@/components/form-info";

export default function CreateOrganizationPage() {
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (params: OrganizationFormParams) => {
    setIsCreating(true);
    try {
      // TODO: replace with actual API call
      console.log(params);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Organization created successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to create organization");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <FormInfo
        title="Create Organization"
        description="Fill out the form to create a new organization."
      >
        <OrganizationForm isCreating={isCreating} onSubmit={handleSubmit} />
      </FormInfo>
    </div>
  );
}
