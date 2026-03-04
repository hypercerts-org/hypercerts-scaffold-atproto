import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Sparkles,
  Shield,
  Layers,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { getAgent, getSession } from "@/lib/atproto-session";

export const metadata: Metadata = {
  description:
    "Create, manage, and verify impact claims on AT Protocol with Hypercerts.",
  openGraph: {
    title: "Hypercerts Scaffold",
    description:
      "Create, manage, and verify impact claims on AT Protocol with Hypercerts.",
  },
};

export default async function Home() {
  const [personalRepo, session] = await Promise.all([getAgent(), getSession()]);

  const profile = personalRepo
    ? await personalRepo.com.atproto.repo
        .getRecord({
          repo: personalRepo.assertDid,
          collection: "app.certified.actor.profile",
          rkey: "self",
        })
        .catch(() => null)
        .then((r) => (r?.data?.value as Record<string, unknown> | null) ?? null)
    : null;

  return (
    <div className="noise-bg relative min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="gradient-mesh absolute inset-0 opacity-40" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="animate-fade-in-up space-y-6 text-center">
            <div className="glass-panel border-create-accent/20 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
              <Sparkles className="text-create-accent h-4 w-4" />
              <span className="text-create-accent font-[family-name:var(--font-outfit)] text-xs font-medium">
                Verifiable Impact Claims
              </span>
            </div>

            <h1 className="text-foreground mx-auto max-w-4xl font-[family-name:var(--font-syne)] text-4xl leading-tight font-bold tracking-tight lg:text-6xl">
              Create Impact Claims
              <br />
              <span className="text-create-accent">That Matter</span>
            </h1>

            <p className="text-muted-foreground mx-auto max-w-2xl font-[family-name:var(--font-outfit)] text-lg lg:text-xl">
              Build verifiable hypercerts on AT Protocol. Track contributions,
              measurements, and evaluations with transparency and trust.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-semibold shadow-md"
              >
                <Link href="/hypercerts/create" className="gap-2">
                  <Sparkles className="h-5 w-5" />
                  Create Hypercert
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="font-[family-name:var(--font-outfit)] font-medium"
              >
                <Link href="/hypercerts" className="gap-2">
                  View My Hypercerts
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div
          className="animate-fade-in-up mb-12 text-center"
          style={{ animationDelay: "100ms" }}
        >
          <h2 className="mb-3 font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight lg:text-3xl">
            Why Hypercerts?
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl font-[family-name:var(--font-outfit)] text-base">
            A new standard for verifiable impact powered by AT Protocol
          </p>
        </div>

        <div className="stagger-children grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="glass-panel hover:border-create-accent/40 space-y-3 rounded-2xl p-6 transition-colors">
            <div className="bg-create-accent/15 flex h-12 w-12 items-center justify-center rounded-xl">
              <Shield className="text-create-accent h-6 w-6" />
            </div>
            <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold">
              Decentralized Identity
            </h3>
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
              Built on AT Protocol. Your claims live on your Personal Data
              Server, fully under your control.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel hover:border-create-accent/40 space-y-3 rounded-2xl p-6 transition-colors">
            <div className="bg-create-accent/15 flex h-12 w-12 items-center justify-center rounded-xl">
              <Layers className="text-create-accent h-6 w-6" />
            </div>
            <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold">
              Rich Metadata
            </h3>
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
              Add contributions, evidence, measurements, evaluations, and
              locations to your claims.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel hover:border-create-accent/40 space-y-3 rounded-2xl p-6 transition-colors">
            <div className="bg-create-accent/15 flex h-12 w-12 items-center justify-center rounded-xl">
              <Zap className="text-create-accent h-6 w-6" />
            </div>
            <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold">
              Production Ready
            </h3>
            <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
              TypeScript SDK, validated lexicons, and real-time sync with your
              AT Protocol repo.
            </p>
          </div>
        </div>
      </section>

      {/* Session Info */}
      {session ? (
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16 lg:pb-24">
          <div className="glass-panel animate-fade-in-up space-y-6 rounded-2xl p-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="mb-2 font-[family-name:var(--font-syne)] text-xl font-bold">
                  Your Session
                </h3>
                <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
                  Signed in with an active AT Protocol session
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>

            <Separator />

            <dl className="grid grid-cols-1 gap-4 font-[family-name:var(--font-outfit)] text-sm md:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs tracking-wider uppercase">
                  DID
                </dt>
                <dd className="text-foreground font-mono text-xs break-all">
                  {session.did}
                </dd>
              </div>
              {profile?.displayName ? (
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs tracking-wider uppercase">
                    Display Name
                  </dt>
                  <dd className="font-medium">
                    {profile.displayName as string}
                  </dd>
                </div>
              ) : null}
              {profile?.handle ? (
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs tracking-wider uppercase">
                    Handle
                  </dt>
                  <dd className="font-medium">@{profile.handle as string}</dd>
                </div>
              ) : null}
            </dl>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                asChild
                className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-medium"
              >
                <Link href="/hypercerts/create" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create Hypercert
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="font-[family-name:var(--font-outfit)] font-medium"
              >
                <Link href="/hypercerts">View My Hypercerts</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Footer CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="gradient-mesh relative overflow-hidden rounded-2xl">
          <div className="noise-bg relative">
            <div className="relative z-10 px-8 py-16 text-center">
              <h2 className="mb-4 font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight lg:text-3xl">
                Ready to create your first hypercert?
              </h2>
              <p className="text-muted-foreground mx-auto mb-8 max-w-xl font-[family-name:var(--font-outfit)] text-base">
                Join the movement for verifiable impact claims built on
                decentralized infrastructure
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-semibold shadow-md"
                >
                  <Link href="/hypercerts/create" className="gap-2">
                    <Sparkles className="h-5 w-5" />
                    Create Hypercert
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="font-[family-name:var(--font-outfit)] font-medium"
                >
                  <Link href="/hypercerts">View Hypercerts</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
