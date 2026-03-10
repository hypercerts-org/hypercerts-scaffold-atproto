import HypercertImage from "@/components/hypercert-image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/atproto-session";
import { getRepoContext } from "@/lib/repo-context";
import { resolveSessionPds } from "@/lib/server-utils";
import { resolveHypercertImageUrl } from "@/lib/utils";
import { OrgHypercertsClaimActivity } from "@hypercerts-org/lexicon";
import { Award, Calendar, FileText, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Hypercerts",
  description: "Browse and manage your hypercert impact claims.",
  openGraph: {
    title: "Hypercerts",
    description: "Browse and manage your hypercert impact claims.",
  },
};

export default async function MyHypercertsPage() {
  const [ctx, session] = await Promise.all([getRepoContext(), getSession()]);

  if (!ctx || !session) redirect("/");

  const [hypercertsResult, pdsUrl] = await Promise.all([
    ctx.agent.com.atproto.repo.listRecords({
      repo: ctx.activeDid,
      collection: "org.hypercerts.claim.activity",
      limit: 100,
    }),
    resolveSessionPds(session),
  ]);

  // listRecords returns { data: { records: Array<{ uri, cid, value }> } }
  const records = hypercertsResult.data.records
    .filter((r) => OrgHypercertsClaimActivity.isRecord(r.value))
    .map((r) => ({
      uri: r.uri,
      record: r.value as OrgHypercertsClaimActivity.Record,
    }));

  return (
    <main className="noise-bg relative min-h-screen">
      <div className="gradient-mesh absolute inset-0 -z-10" />

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
        {/* Header */}
        <div className="animate-fade-in-up space-y-3 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-create-accent/10 flex size-10 items-center justify-center rounded-full">
              <Award className="text-create-accent size-5" />
            </div>
            <h1 className="font-[family-name:var(--font-syne)] text-4xl font-bold tracking-tight md:text-5xl">
              Hypercerts
            </h1>
          </div>
        </div>

        {/* Content */}
        {records.length === 0 ? (
          <div className="animate-fade-in-up [animation-delay:100ms]">
            <div className="glass-panel mx-auto max-w-md space-y-4 rounded-2xl p-12 text-center">
              <div className="bg-create-accent/10 mx-auto flex size-16 items-center justify-center rounded-full">
                <FileText className="text-create-accent size-8" />
              </div>
              <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
                No hypercerts found
              </h2>
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
                Get started by creating your first hypercert to track and verify
                your impact.
              </p>
              <Button
                asChild
                className="bg-create-accent hover:bg-create-accent/90 mt-2 font-[family-name:var(--font-outfit)] text-white"
              >
                <Link href="/hypercerts/create">
                  <Plus className="mr-2 size-4" />
                  Create Hypercert
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up [animation-delay:100ms]">
            <div className="stagger-children grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {records.map(({ record: cert, uri }) => {
                const imageUrl =
                  ctx.activeDid && cert.image
                    ? resolveHypercertImageUrl(
                        cert.image,
                        ctx.activeDid,
                        pdsUrl,
                      )
                    : null;

                let workScope: string[] = [];
                if (
                  cert.workScope &&
                  OrgHypercertsClaimActivity.isWorkScopeString(cert.workScope)
                ) {
                  workScope = cert.workScope.scope
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean);
                }
                const createdDate = cert.createdAt
                  ? new Date(cert.createdAt).toLocaleDateString()
                  : null;

                return (
                  <Link
                    key={uri}
                    href={`/hypercerts/${encodeURIComponent(uri)}`}
                    className="group"
                  >
                    <Card className="glass-panel border-border/50 hover:border-create-accent/50 flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg">
                      {/* Image or Placeholder */}
                      <div className="from-create-accent/20 via-create-accent/10 relative aspect-[4/3] overflow-hidden bg-gradient-to-br to-transparent">
                        <HypercertImage
                          src={imageUrl}
                          alt={cert.title || "Hypercert cover"}
                          className="transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      {/* Content */}
                      <CardHeader className="flex-1">
                        <CardTitle className="group-hover:text-create-accent line-clamp-1 font-[family-name:var(--font-syne)] text-lg transition-colors">
                          {cert.title || "Untitled"}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 font-[family-name:var(--font-outfit)] text-sm">
                          {cert.shortDescription || "No description provided"}
                        </CardDescription>

                        {/* Metadata */}
                        <div className="flex flex-col gap-2 pt-3">
                          {createdDate ? (
                            <div className="text-muted-foreground flex items-center gap-1.5 font-[family-name:var(--font-outfit)] text-xs">
                              <Calendar className="size-3" />
                              <span>{createdDate}</span>
                            </div>
                          ) : null}

                          {workScope.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {workScope.slice(0, 3).map((scope: string) => (
                                <span
                                  key={scope}
                                  className="bg-create-accent/10 text-create-accent border-create-accent/20 inline-flex items-center rounded-full border px-2 py-0.5 font-[family-name:var(--font-outfit)] text-xs"
                                >
                                  {scope}
                                </span>
                              ))}
                              {workScope.length > 3 ? (
                                <span className="text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 font-[family-name:var(--font-outfit)] text-xs">
                                  +{workScope.length - 3}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
