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
import AddContributorsForm from "@/components/add-contributors-form";
import Link from "next/link";
import { Link2 } from "lucide-react";

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
    if (!createdOrg) {
      return (
        <div className="max-w-7xl mx-auto py-8 px-4 text-center">
          <h2 className="text-2xl font-bold">Error</h2>
          <p>Organization data is not available.</p>
        </div>
      );
    }
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <AddContributorsForm orgInfo={createdOrg} />
        <FormInfo title="Organization Information">
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Name</p>
              <p>{createdOrg.name}</p>
            </div>
            <div>
              <p className="font-semibold">Handle</p>
              <p>{createdOrg.handle}</p>
            </div>

            <div>
              <p className="font-semibold">DID</p>
              <p>{createdOrg.did}</p>
            </div>

            <div className="pt-4">
              <Link className="underline text-blue-400 flex gap-2" href={`/organizations/${createdOrg.did}`}>
                <Link2/> View Organization
              </Link>
            </div>
          </div>
        </FormInfo>
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
