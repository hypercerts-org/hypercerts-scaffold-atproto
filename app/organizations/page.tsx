import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getRepoContext } from "@/lib/repo-context";
import { Building2, Plus, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Organizations",
  description:
    "Browse and manage organizations on the Hypercerts platform. Create shared workspaces for collaborative impact claims.",
  openGraph: {
    title: "Organizations",
    description:
      "Browse and manage organizations on the Hypercerts platform.",
  },
};

export default async function OrganizationsList() {
  const ctx = await getRepoContext({ serverOverride: "sds" });

  if (!ctx) {
    return (
      <main className="relative min-h-screen noise-bg">
        <div className="gradient-mesh absolute inset-0 -z-10" />
        <div className="max-w-5xl mx-auto py-12 px-4 space-y-8">
          <div className="text-center space-y-3 animate-fade-in-up">
            <div className="flex items-center justify-center gap-3">
              <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center">
                <Building2 className="size-5 text-create-accent" />
              </div>
              <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-syne)] font-bold tracking-tight">
                Organizations
              </h1>
            </div>
            <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
              Please log in to view organizations.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { organizations } = await ctx.repository.organizations.list({
    limit: 50,
  });

  return (
    <main className="relative min-h-screen noise-bg">
      <div className="gradient-mesh absolute inset-0 -z-10" />

      <div className="max-w-5xl mx-auto py-12 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-center gap-3">
            <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center">
              <Building2 className="size-5 text-create-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-syne)] font-bold tracking-tight">
              Organizations
            </h1>
          </div>
          <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
            Shared workspaces for collaborative impact claims
          </p>
        </div>

        {/* Action bar */}
        <div className="animate-fade-in-up [animation-delay:100ms]">
          <div className="glass-panel rounded-2xl p-3 flex items-center justify-center max-w-xs mx-auto">
            <Button
              asChild
              size="sm"
              className="rounded-full bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-medium gap-2"
            >
              <Link href="/organizations/create">
                <Plus className="size-4" />
                Create Organization
              </Link>
            </Button>
          </div>
        </div>

        {/* Content */}
        {organizations?.length > 0 ? (
          <div className="animate-fade-in-up [animation-delay:200ms]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {organizations.map((org) => (
                <Link
                  key={org.did}
                  href={`/organizations/${encodeURIComponent(org.did)}`}
                  className="group"
                >
                  <div className="glass-panel rounded-xl overflow-hidden border border-border/50 hover:border-create-accent/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    {/* Accent strip */}
                    <div className="h-1.5 bg-gradient-to-r from-create-accent/60 via-create-accent/30 to-transparent" />

                    <div className="p-5 flex-1 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="size-10 rounded-xl bg-create-accent/10 flex items-center justify-center shrink-0">
                          <Building2 className="size-5 text-create-accent" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-[family-name:var(--font-syne)] font-bold text-lg leading-tight group-hover:text-create-accent transition-colors line-clamp-1">
                            {org.name}
                          </h3>
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-[family-name:var(--font-outfit)] bg-create-accent/10 text-create-accent border border-create-accent/20">
                            @{org.handle}
                          </span>
                        </div>
                      </div>

                      {org.description && (
                        <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground line-clamp-2 leading-relaxed">
                          {org.description}
                        </p>
                      )}

                      <div className="mt-auto pt-2 flex items-center gap-1.5 text-xs font-[family-name:var(--font-outfit)] text-muted-foreground">
                        <Users className="size-3" />
                        <span>Organization</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up [animation-delay:200ms]">
            <div className="glass-panel rounded-2xl p-12 max-w-md mx-auto text-center space-y-4">
              <div className="size-16 rounded-full bg-create-accent/10 flex items-center justify-center mx-auto">
                <Building2 className="size-8 text-create-accent" />
              </div>
              <h2 className="text-xl font-[family-name:var(--font-syne)] font-semibold">
                No organizations yet
              </h2>
              <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
                Create your first organization to start collaborating on impact claims.
              </p>
              <Button
                asChild
                className="bg-create-accent hover:bg-create-accent/90 text-white font-[family-name:var(--font-outfit)] mt-2"
              >
                <Link href="/organizations/create">
                  <Plus className="size-4 mr-2" />
                  Create Organization
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
