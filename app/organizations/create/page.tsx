"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import OrganizationForm, {
  OrganizationFormParams,
} from "@/components/organization-form";
import FormInfo from "@/components/form-info";
import { createOrganization } from "@/lib/create-actions";
import OrganizationCreationSuccess from "@/components/organization-creation-success";
import { OrganizationInfo } from "@hypercerts-org/sdk-core";

export default function CreateOrganizationPage() {
  const [createdOrg, setCreatedOrg] = useState<OrganizationInfo | null>(null);
  const [showNextComponent, setShowNextComponent] = useState(false);

  const mutation = useMutation({
    mutationFn: (params: OrganizationFormParams) => createOrganization(params),
    onSuccess: (data) => {
      setCreatedOrg(data);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to create organization");
    },
  });

  const handleSubmit = (params: OrganizationFormParams) => {
    mutation.mutate(params);
  };

  const handleNext = () => {
    setShowNextComponent(true);
  };

  if (showNextComponent) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold">Next Component</h2>
        <p>This is the component displayed after clicking next.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {createdOrg ? (
        <OrganizationCreationSuccess orgInfo={createdOrg} onNext={handleNext} />
      ) : (
        <FormInfo
          title="Create Organization"
          description="Fill out the form to create a new organization."
        >
          <OrganizationForm
            isCreating={mutation.isPending}
            onSubmit={handleSubmit}
          />
        </FormInfo>
      )}
    </div>
  );
}
