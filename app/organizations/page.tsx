import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRepoContext } from "@/lib/repo-context";

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
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Organizations</h1>
          <Link href="/organizations/create">
            <Button>Create Organization</Button>
          </Link>
        </div>
        <p className="text-gray-600">Please log in to view organizations.</p>
      </div>
    );
  }

  const { organizations } = await ctx.repository.organizations.list({
    limit: 50,
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <Link href="/organizations/create">
          <Button>Create Organization</Button>
        </Link>
      </div>

      {organizations?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Link
              key={org.did}
              href={`/organizations/${encodeURIComponent(org.did)}`}
            >
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>{org.handle}</CardDescription>
                </CardHeader>
                <div className="px-6 pb-6">
                  <p className="text-sm text-gray-600">{org.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No organizations to display.</p>
      )}
    </div>
  );
}
