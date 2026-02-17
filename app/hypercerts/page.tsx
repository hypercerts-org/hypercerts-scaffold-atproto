import type { Metadata } from "next";
import Loader from "@/components/loader";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRepoContext } from "@/lib/repo-context";
import { getSession } from "@/lib/atproto-session";
import { getBlobURL } from "@/lib/utils";
import { resolveSessionPds } from "@/lib/server-utils";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Calendar, Plus, FileText } from "lucide-react";
import { OrgHypercertsDefs } from "@hypercerts-org/sdk-core";

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

  const { records } = await ctx.scopedRepo.hypercerts.list({ limit: 100 });
  const pdsUrl = await resolveSessionPds(session);

  return (
    <main className="relative min-h-screen noise-bg">
      <div className="gradient-mesh absolute inset-0 -z-10" />

      <div className="max-w-5xl mx-auto py-12 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-center gap-3">
            <div className="size-10 rounded-full bg-create-accent/10 flex items-center justify-center">
              <Award className="size-5 text-create-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-syne)] font-bold tracking-tight">
              Hypercerts
            </h1>
          </div>
        </div>

        {/* Content */}
        {!records ? (
          <div className="animate-fade-in-up [animation-delay:100ms]">
            <div className="glass-panel rounded-2xl p-12 max-w-md mx-auto">
              <Loader />
            </div>
          </div>
        ) : records.length === 0 ? (
          <div className="animate-fade-in-up [animation-delay:100ms]">
            <div className="glass-panel rounded-2xl p-12 max-w-md mx-auto text-center space-y-4">
              <div className="size-16 rounded-full bg-create-accent/10 flex items-center justify-center mx-auto">
                <FileText className="size-8 text-create-accent" />
              </div>
              <h2 className="text-xl font-[family-name:var(--font-syne)] font-semibold">
                No hypercerts found
              </h2>
              <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
                Get started by creating your first hypercert to track and verify
                your impact.
              </p>
              <Button
                asChild
                className="bg-create-accent hover:bg-create-accent/90 text-white font-[family-name:var(--font-outfit)] mt-2"
              >
                <Link href="/hypercerts/create">
                  <Plus className="size-4 mr-2" />
                  Create Hypercert
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up [animation-delay:100ms]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {records.map(({ record: cert, uri }) => {
                const imageUrl =
                  ctx.activeDid && cert.image
                    ? getBlobURL(
                        (cert.image as OrgHypercertsDefs.SmallImage).image,
                        ctx.activeDid,
                        pdsUrl,
                      )
                    : null;

                const workScope = Array.isArray(cert.workScope)
                  ? cert.workScope
                  : [];
                const createdDate = cert.createdAt
                  ? new Date(cert.createdAt).toLocaleDateString()
                  : null;

                return (
                  <Link
                    key={uri}
                    href={`/hypercerts/${encodeURIComponent(uri)}`}
                    className="group"
                  >
                    <Card className="glass-panel rounded-xl overflow-hidden border border-border/50 hover:border-create-accent/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      {/* Image or Placeholder */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-create-accent/20 via-create-accent/10 to-transparent">
                        {imageUrl ? (
                          <Image
                            fill
                            alt={cert.title || "Hypercert cover"}
                            src={imageUrl}
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Award className="size-16 text-create-accent/30" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <CardHeader className="flex-1">
                        <CardTitle className="font-[family-name:var(--font-syne)] text-lg line-clamp-1 group-hover:text-create-accent transition-colors">
                          {cert.title || "Untitled"}
                        </CardTitle>
                        <CardDescription className="font-[family-name:var(--font-outfit)] text-sm line-clamp-2">
                          {cert.shortDescription || "No description provided"}
                        </CardDescription>

                        {/* Metadata */}
                        <div className="flex flex-col gap-2 pt-3">
                          {createdDate && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-[family-name:var(--font-outfit)]">
                              <Calendar className="size-3" />
                              <span>{createdDate}</span>
                            </div>
                          )}

                          {workScope.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {workScope.slice(0, 3).map((scope: string) => (
                                <span
                                  key={scope}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-[family-name:var(--font-outfit)] bg-create-accent/10 text-create-accent border border-create-accent/20"
                                >
                                  {scope}
                                </span>
                              ))}
                              {workScope.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-[family-name:var(--font-outfit)] text-muted-foreground">
                                  +{workScope.length - 3}
                                </span>
                              )}
                            </div>
                          )}
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
