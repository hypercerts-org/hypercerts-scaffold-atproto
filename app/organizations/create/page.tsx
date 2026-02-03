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
import type { OrganizationInfo } from "@hypercerts-org/sdk-core";
import AddContributorsForm from "@/components/add-contributors-form";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

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
        <div className="relative min-h-screen noise-bg">
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-12">
            <div className="glass-panel rounded-2xl p-12 max-w-md mx-auto text-center space-y-4 animate-fade-in-up">
              <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <Building2 className="size-6 text-destructive" />
              </div>
              <h2 className="text-xl font-[family-name:var(--font-syne)] font-bold">
                Error
              </h2>
              <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
                Organization data is not available.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="relative min-h-screen noise-bg">
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-12">
          {/* Page header */}
          <div className="mb-8 lg:mb-10 animate-fade-in">
            <h1 className="text-3xl lg:text-4xl font-[family-name:var(--font-syne)] font-bold tracking-tight text-foreground">
              Add Contributors
            </h1>
            <p className="mt-2 text-sm font-[family-name:var(--font-outfit)] text-muted-foreground max-w-xl">
              Invite people to collaborate on{" "}
              <span className="font-medium text-create-accent">
                {createdOrg.name}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-12 animate-fade-in-up">
            {/* Main: add contributors */}
            <main className="min-w-0">
              <AddContributorsForm orgInfo={createdOrg} />
            </main>

            {/* Sidebar: org info summary */}
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-create-accent/60 via-create-accent/30 to-transparent" />
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-create-accent/10 flex items-center justify-center">
                      <Building2 className="size-5 text-create-accent" />
                    </div>
                    <div>
                      <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm">
                        {createdOrg.name}
                      </h3>
                      <span className="text-xs font-[family-name:var(--font-outfit)] text-muted-foreground">
                        @{createdOrg.handle}
                      </span>
                    </div>
                  </div>

                  <dl className="space-y-3 text-sm font-[family-name:var(--font-outfit)]">
                    <div className="space-y-1">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                        DID
                      </dt>
                      <dd className="font-mono text-xs break-all text-foreground">
                        {createdOrg.did}
                      </dd>
                    </div>
                  </dl>

                  <div className="pt-2 border-t border-border/50">
                    <Link
                      className="inline-flex items-center gap-2 text-sm font-[family-name:var(--font-outfit)] font-medium text-create-accent hover:text-create-accent/80 transition-colors"
                      href={`/organizations/${createdOrg.did}`}
                    >
                      View Organization
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen noise-bg">
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Page header */}
        <div className="mb-8 lg:mb-10 animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-[family-name:var(--font-syne)] font-bold tracking-tight text-foreground">
            Create Organization
          </h1>
          <p className="mt-2 text-sm font-[family-name:var(--font-outfit)] text-muted-foreground max-w-xl">
            Set up a shared workspace for collaborative impact claims.
          </p>
        </div>

        <div className="max-w-2xl animate-fade-in-up">
          {createdOrg ? (
            <OrganizationCreationSuccess
              orgInfo={createdOrg}
              onNext={handleNext}
            />
          ) : (
            <FormInfo
              title="Organization Details"
              description="Fill out the form below to create a new organization."
            >
              <OrganizationForm
                isCreating={mutation.isPending}
                onSubmit={handleSubmit}
              />
            </FormInfo>
          )}
        </div>
      </div>
    </div>
  );
}
