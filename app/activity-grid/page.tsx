import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Grid3X3, Sparkles, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { ActivityClaimGrid } from "@/components/activity-claim-grid";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/atproto-session";
import { getActivityGridClaims } from "@/lib/activity-grid";
import { getRepoContext } from "@/lib/repo-context";
import { resolveSessionPds } from "@/lib/server-utils";

export const metadata: Metadata = {
  title: "Activity Grid",
  description:
    "Visualize activity claims as weighted contributor image grids inspired by Hyperboards.",
  openGraph: {
    title: "Activity Grid",
    description:
      "Visualize activity claims as weighted contributor image grids inspired by Hyperboards.",
  },
};

export default async function ActivityGridPage() {
  const [ctx, session] = await Promise.all([getRepoContext(), getSession()]);

  if (!ctx || !session) redirect("/");

  const pdsUrl = await resolveSessionPds(session);
  const claims = await getActivityGridClaims({
    agent: ctx.agent,
    ownerDid: ctx.userDid,
    pdsUrl,
  });
  const totalContributors = claims.reduce(
    (sum, claim) => sum + claim.contributors.length,
    0,
  );
  const totalWeight = claims.reduce((sum, claim) => sum + claim.totalWeight, 0);

  return (
    <main className="noise-bg relative min-h-screen overflow-hidden bg-[#efe9dc] text-stone-950">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_12%,rgba(132,204,22,0.28),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.24),transparent_28%),linear-gradient(180deg,#f7f1e6,#ebe3d2)]" />
      <div className="absolute top-0 left-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-white/40 blur-3xl" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(28,25,23,0.07)_0_1px,transparent_1px_26px)]" />

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-6 md:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="animate-fade-in-up space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-950/10 bg-white/55 px-4 py-2 shadow-sm backdrop-blur">
              <Sparkles className="size-4 text-lime-700" />
              <span className="font-[family-name:var(--font-outfit)] text-xs font-bold tracking-[0.22em] text-stone-700 uppercase">
                Hyperboards-style activity map
              </span>
            </div>

            <div className="max-w-4xl space-y-4">
              <h1 className="font-[family-name:var(--font-syne)] text-5xl leading-[0.9] font-black tracking-[-0.06em] text-stone-950 md:text-7xl">
                Activity claims, weighted like living terrain.
              </h1>
              <p className="max-w-2xl font-[family-name:var(--font-outfit)] text-lg leading-8 text-stone-700">
                Each claim becomes a visual field: contributor images scale by
                contributionWeight, work-scope tags stay visible, and the claim
                cover anchors the story.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="rounded-full bg-stone-950 px-5 font-[family-name:var(--font-outfit)] text-white hover:bg-stone-800"
              >
                <Link href="/hypercerts/create">
                  Create activity claim
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-stone-950/15 bg-white/45 px-5 font-[family-name:var(--font-outfit)] text-stone-800 backdrop-blur hover:bg-white/70"
              >
                <Link href="/hypercerts">Browse records</Link>
              </Button>
            </div>
          </div>

          <div className="animate-fade-in-up grid gap-3 [animation-delay:120ms] sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-[1.5rem] border border-stone-950/10 bg-white/50 p-5 shadow-sm backdrop-blur">
              <Grid3X3 className="mb-4 size-5 text-lime-700" />
              <p className="font-[family-name:var(--font-syne)] text-4xl font-black tracking-tight">
                {claims.length}
              </p>
              <p className="font-[family-name:var(--font-outfit)] text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                claims
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-950/10 bg-white/50 p-5 shadow-sm backdrop-blur">
              <Users className="mb-4 size-5 text-amber-700" />
              <p className="font-[family-name:var(--font-syne)] text-4xl font-black tracking-tight">
                {totalContributors}
              </p>
              <p className="font-[family-name:var(--font-outfit)] text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                contributors
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-950/10 bg-white/50 p-5 shadow-sm backdrop-blur">
              <Sparkles className="mb-4 size-5 text-indigo-700" />
              <p className="font-[family-name:var(--font-syne)] text-4xl font-black tracking-tight">
                {totalWeight.toLocaleString()}
              </p>
              <p className="font-[family-name:var(--font-outfit)] text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                weight
              </p>
            </div>
          </div>
        </section>

        <div className="animate-fade-in-up [animation-delay:180ms]">
          <ActivityClaimGrid claims={claims} />
        </div>
      </div>
    </main>
  );
}
