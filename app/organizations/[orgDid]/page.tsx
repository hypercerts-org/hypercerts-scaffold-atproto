import AddContributorsForm from "@/components/add-contributors-form";
import CollaboratorsList from "@/components/collaborators-list-view";
import OrganizationDetailsView from "@/components/organization-detail-view";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { getAuthenticatedRepo } from "@/lib/atproto-session";
import type { RepositoryAccessGrant } from "@hypercerts-org/sdk-core";

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

  const sdsRepo = await getAuthenticatedRepo("sds");
  if (!sdsRepo) return <div>Please log in to view organizations.</div>;

  const org = await sdsRepo.organizations.get(decodedOrgDid);
  if (!org) return <div>Organization not found</div>;

  let collaborators: (RepositoryAccessGrant & {
    userProfile?: BskyProfile | null;
  })[] = [];

  try {
    const result = await sdsRepo.collaborators.list({
      repoDid: decodedOrgDid,
      limit: 50,
    });

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
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <OrganizationDetailsView organization={org} />
      <CollaboratorsList
        repoDid={decodedOrgDid}
        collaborators={collaborators}
      />
      <AddContributorsForm orgInfo={org} />
      <Card>
        <CardHeader>
          <CardTitle>Raw data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto rounded-md border bg-muted p-4">
            {JSON.stringify(org, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
