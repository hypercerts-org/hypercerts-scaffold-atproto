import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
import { getAuthenticatedRepo, getSession } from "@/lib/atproto-session";

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
  const [personalRepo, session] = await Promise.all([
    getAuthenticatedRepo("pds"),
    getSession(),
  ]);
  
  const profile = personalRepo ? await personalRepo.profile.getCertifiedProfile().catch(() => null) : null;
  const isSignedIn = !!session;

  return (
    <div className="relative min-h-screen noise-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="gradient-mesh absolute inset-0 opacity-40" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="text-center space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-create-accent/20">
              <Sparkles className="h-4 w-4 text-create-accent" />
              <span className="text-xs font-[family-name:var(--font-outfit)] font-medium text-create-accent">
                Verifiable Impact Claims
              </span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-[family-name:var(--font-syne)] font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
              Create Impact Claims
              <br />
              <span className="text-create-accent">That Matter</span>
            </h1>
            
            <p className="text-lg lg:text-xl font-[family-name:var(--font-outfit)] text-muted-foreground max-w-2xl mx-auto">
              Build verifiable hypercerts on AT Protocol. Track contributions, measurements, and evaluations with transparency and trust.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              {isSignedIn ? (
                <>
                  <Button asChild size="lg" className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-semibold shadow-md">
                    <Link href="/hypercerts/create" className="gap-2">
                      <Sparkles className="h-5 w-5" />
                      Create Hypercert
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="font-[family-name:var(--font-outfit)] font-medium">
                    <Link href="/hypercerts" className="gap-2">
                      View My Hypercerts
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="glass-panel rounded-xl p-6 max-w-md w-full">
                  <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground text-center mb-4">
                    Sign in to get started creating hypercerts
                  </p>
                  <Button asChild size="lg" className="w-full bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-semibold">
                    <Link href="#" className="gap-2">
                      Sign In to Continue
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 lg:py-24">
        <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <h2 className="text-2xl lg:text-3xl font-[family-name:var(--font-syne)] font-bold tracking-tight mb-3">
            Why Hypercerts?
          </h2>
          <p className="text-base font-[family-name:var(--font-outfit)] text-muted-foreground max-w-2xl mx-auto">
            A new standard for verifiable impact powered by AT Protocol
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
          {/* Feature 1 */}
          <div className="glass-panel rounded-2xl p-6 space-y-3 hover:border-create-accent/40 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-create-accent/15 flex items-center justify-center">
              <Shield className="h-6 w-6 text-create-accent" />
            </div>
            <h3 className="text-lg font-[family-name:var(--font-syne)] font-bold">
              Decentralized Identity
            </h3>
            <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
              Built on AT Protocol. Your claims live on your Personal Data Server, fully under your control.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel rounded-2xl p-6 space-y-3 hover:border-create-accent/40 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-create-accent/15 flex items-center justify-center">
              <Layers className="h-6 w-6 text-create-accent" />
            </div>
            <h3 className="text-lg font-[family-name:var(--font-syne)] font-bold">
              Rich Metadata
            </h3>
            <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
              Add contributions, evidence, measurements, evaluations, and locations to your claims.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel rounded-2xl p-6 space-y-3 hover:border-create-accent/40 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-create-accent/15 flex items-center justify-center">
              <Zap className="h-6 w-6 text-create-accent" />
            </div>
            <h3 className="text-lg font-[family-name:var(--font-syne)] font-bold">
              Production Ready
            </h3>
            <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
              TypeScript SDK, validated lexicons, and real-time sync with your AT Protocol repo.
            </p>
          </div>
        </div>
      </section>

      {/* Session Info (if signed in) */}
      {isSignedIn && session && (
        <section className="relative z-10 max-w-6xl mx-auto px-6 pb-16 lg:pb-24">
          <div className="glass-panel rounded-2xl p-8 space-y-6 animate-fade-in-up">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-[family-name:var(--font-syne)] font-bold mb-2">
                  Your Session
                </h3>
                <p className="text-sm font-[family-name:var(--font-outfit)] text-muted-foreground">
                  Signed in with an active AT Protocol session
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>

            <Separator />

            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-[family-name:var(--font-outfit)]">
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">DID</dt>
                <dd className="font-mono text-xs break-all text-foreground">{session.did}</dd>
              </div>
              {profile?.displayName && (
                <div className="space-y-1">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">Display Name</dt>
                  <dd className="font-medium">{profile.displayName}</dd>
                </div>
              )}
              {profile?.handle && (
                <div className="space-y-1">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">Handle</dt>
                  <dd className="font-medium">@{profile.handle}</dd>
                </div>
              )}
            </dl>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-medium">
                <Link href="/hypercerts/create" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create Hypercert
                </Link>
              </Button>
              <Button asChild variant="outline" className="font-[family-name:var(--font-outfit)] font-medium">
                <Link href="/hypercerts">
                  View My Hypercerts
                </Link>
              </Button>
              <Button asChild variant="outline" className="font-[family-name:var(--font-outfit)] font-medium">
                <Link href="/organizations">
                  Organizations
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="relative overflow-hidden rounded-2xl gradient-mesh">
          <div className="noise-bg relative">
            <div className="relative z-10 px-8 py-16 text-center">
              <h2 className="text-2xl lg:text-3xl font-[family-name:var(--font-syne)] font-bold tracking-tight mb-4">
                Ready to create your first hypercert?
              </h2>
              <p className="text-base font-[family-name:var(--font-outfit)] text-muted-foreground mb-8 max-w-xl mx-auto">
                Join the movement for verifiable impact claims built on decentralized infrastructure
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {isSignedIn ? (
                  <>
                    <Button asChild size="lg" className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-semibold shadow-md">
                      <Link href="/hypercerts/create" className="gap-2">
                        <Sparkles className="h-5 w-5" />
                        Create Hypercert
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="font-[family-name:var(--font-outfit)] font-medium">
                      <Link href="/hypercerts">
                        View Hypercerts
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild size="lg" className="bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-semibold shadow-md">
                    <Link href="#" className="gap-2">
                      Sign In to Get Started
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
