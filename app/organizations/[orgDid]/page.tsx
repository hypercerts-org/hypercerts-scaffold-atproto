import OrganizationDetailsView from "@/components/organization-detail-view";
import { getAuthenticatedRepo } from "@/lib/atproto-session";

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ orgDid: string }>;
}) {
  const { orgDid } = await params;
  const decodedDid = decodeURIComponent(orgDid);

  const sdsRepo = await getAuthenticatedRepo("sds");
  if (!sdsRepo) return <div>Please log in to view organizations.</div>;

  const org = await sdsRepo.organizations.get(decodedDid);
  if (!org) return <div>Organization not found</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <OrganizationDetailsView organization={org} />
    </div>
  );
}
