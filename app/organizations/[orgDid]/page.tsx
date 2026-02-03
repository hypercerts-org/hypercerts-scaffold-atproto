import type { Metadata } from "next";
import AddContributorsForm from "@/components/add-contributors-form";
import CollaboratorsList from "@/components/collaborators-list-view";
import OrganizationDetailsView from "@/components/organization-detail-view";
import { getAuthenticatedRepo } from "@/lib/atproto-session";
import { getRepoContext } from "@/lib/repo-context";
import type { RepositoryAccessGrant } from "@hypercerts-org/sdk-core";
import { Building2 } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgDid: string }>;
}): Promise<Metadata> {
  const { orgDid } = await params;
  const decodedOrgDid = decodeURIComponent(orgDid);

  try {
    const sdsRepo = await getRepoContext({
      serverOverride: "sds",
      targetDid: decodedOrgDid,
    });
    if (!sdsRepo) {
      return { title: "Organization" };
    }

    const org = await sdsRepo.scopedRepo.organizations.get(decodedOrgDid);
    if (!org) {
      return { title: "Organization Not Found" };
    }

    const title = org.name || "Organization";
    const description =
      org.description || "View this organization on Hypercerts Scaffold.";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
    };
  } catch {
    return { title: "Organization" };
  }
}

type BskyProfile = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
};

async function getBskyProfile(actor: string): Promise<BskyProfile | null> {
  const url = new URL(
    "/xrpc/app.bsky.actor.getProfile",
    "https://public.api.bsky.app"
  );
  url.searchParams.set("actor", actor);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!res.ok) return null;
  return (await res.json()) as BskyProfile;
}

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ orgDid: string }>;
}) {
  const { orgDid } = await params;
  const decodedOrgDid = decodeURIComponent(orgDid);

  const sdsRepo = await getRepoContext({
    serverOverride: "sds",
    targetDid: decodedOrgDid,
  });

  if (!sdsRepo) {
    return (
      <main className="relative min-h-screen noise-bg">
        <div className="gradient-mesh absolute inset-0 -z-10" />
        <div className="max-w-5xl mx-auto py-12 px-4">
          <div className="glass-panel rounded-2xl p-12 max-w-md mx-auto text-center space-y-4 animate-fade-in-up">
            <div className="size-12 rounded-full bg-create-accent/10 flex items-center justify-center mx-auto">
              <Building2 className="size-6 text-create-accent" />
            </div>
            <h2 className="text-xl font-[family-name:var(--font-syne)] font-semibold">
              Sign in required
            </h2>
            <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
              Please log in to view organizations.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const [org, collabResult] = await Promise.all([
    sdsRepo.scopedRepo.organizations.get(decodedOrgDid),
    sdsRepo.scopedRepo.collaborators.list({ limit: 50 }).catch(() => null),
  ]);

  if (!org) {
    return (
      <main className="relative min-h-screen noise-bg">
        <div className="gradient-mesh absolute inset-0 -z-10" />
        <div className="max-w-5xl mx-auto py-12 px-4">
          <div className="glass-panel rounded-2xl p-12 max-w-md mx-auto text-center space-y-4 animate-fade-in-up">
            <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Building2 className="size-6 text-destructive" />
            </div>
            <h2 className="text-xl font-[family-name:var(--font-syne)] font-semibold">
              Organization not found
            </h2>
            <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
              The organization you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              href="/organizations"
              className="inline-flex items-center text-sm font-[family-name:var(--font-outfit)] font-medium text-create-accent hover:text-create-accent/80 transition-colors"
            >
              Back to Organizations
            </Link>
          </div>
        </div>
      </main>
    );
  }

  let collaborators: (RepositoryAccessGrant & {
    userProfile?: BskyProfile | null;
  })[] = [];

  try {
    if (!collabResult) throw new Error("Failed to fetch collaborators");
    const result = collabResult;

    const active = result.collaborators.filter((c) => !c.revokedAt);

    const profiles = await Promise.allSettled(
      active.map((c) => getBskyProfile(c.userDid))
    );

    collaborators = active.map((c, i) => {
      const p = profiles[i];
      return {
        ...c,
        userProfile: p.status === "fulfilled" ? p.value : null,
      };
    });
  } catch (e) {
    console.error(e);
  }

  return (
    <main className="relative min-h-screen noise-bg">
      <div className="gradient-mesh absolute inset-0 -z-10" />

      <div className="relative z-10 max-w-4xl mx-auto py-8 lg:py-12 px-4 space-y-8">
        {/* Breadcrumb + header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-[family-name:var(--font-outfit)] text-muted-foreground mb-4">
            <Link
              href="/organizations"
              className="hover:text-create-accent transition-colors"
            >
              Organizations
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{org.name}</span>
          </div>
        </div>

        <div className="space-y-6 animate-fade-in-up stagger-children">
          <OrganizationDetailsView organization={org} />
          <CollaboratorsList
            repoDid={decodedOrgDid}
            collaborators={collaborators}
          />
          <AddContributorsForm orgInfo={org} />
        </div>
      </div>
    </main>
  );
}
