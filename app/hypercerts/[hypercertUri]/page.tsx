import HypercertDetailsView from "@/components/hypercert-detail-view";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/atproto-session";
import { getRepoContext } from "@/lib/repo-context";
import { resolveSessionPds } from "@/lib/server-utils";
import {
  extractDidFromAtUri,
  parseAtUri,
  resolveHypercertImageUrl,
} from "@/lib/utils";
import { OrgHypercertsClaimActivity } from "@hypercerts-org/lexicon";
import { AlertCircle, ArrowLeft, LogIn } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hypercertUri: string }>;
}): Promise<Metadata> {
  const { hypercertUri } = await params;
  const decodedUri = decodeURIComponent(hypercertUri);
  const ownerDid = extractDidFromAtUri(decodedUri);

  if (!ownerDid) {
    return { title: "Hypercert Not Found" };
  }

  try {
    const viewCtx = await getRepoContext({ targetDid: ownerDid });
    if (!viewCtx) {
      return { title: "Hypercert" };
    }

    const parsed = parseAtUri(decodedUri);
    const certResult = parsed
      ? await viewCtx.agent.com.atproto.repo
          .getRecord({
            repo: parsed.did,
            collection: parsed.collection || "org.hypercerts.claim.activity",
            rkey: parsed.rkey,
          })
          .catch(() => null)
      : null;
    const rawValue = certResult?.data.value;
    if (!OrgHypercertsClaimActivity.isRecord(rawValue)) {
      return { title: "Hypercert Not Found" };
    }
    const certRecord = rawValue as OrgHypercertsClaimActivity.Record;

    const title = certRecord.title || "Hypercert";
    const description =
      certRecord.shortDescription || "View this hypercert impact claim.";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
    };
  } catch {
    return { title: "Hypercert" };
  }
}

export default async function HypercertViewPage({
  params,
}: {
  params: Promise<{ hypercertUri: string }>;
}) {
  const { hypercertUri } = await params;
  const decodedUri = decodeURIComponent(hypercertUri);

  const ownerDid = extractDidFromAtUri(decodedUri);
  if (!ownerDid)
    return (
      <main className="noise-bg relative min-h-screen">
        <div className="gradient-mesh absolute inset-0 -z-10" />
        <div className="relative z-10 mx-auto max-w-4xl space-y-6 px-4 py-8">
          <div className="animate-fade-in-up">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-create-accent font-[family-name:var(--font-outfit)] transition-colors"
            >
              <Link href="/hypercerts">
                <ArrowLeft className="mr-2 size-4" />
                Back to Hypercerts
              </Link>
            </Button>
          </div>
          <div className="animate-fade-in-up">
            <div className="glass-panel space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <AlertCircle className="mx-auto size-8 text-red-400" />
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
                Invalid hypercert URI.
              </p>
            </div>
          </div>
        </div>
      </main>
    );

  const [viewCtx, session] = await Promise.all([
    getRepoContext({ targetDid: ownerDid }),
    getSession(),
  ]);
  if (!viewCtx)
    return (
      <main className="noise-bg relative min-h-screen">
        <div className="gradient-mesh absolute inset-0 -z-10" />
        <div className="relative z-10 mx-auto max-w-4xl space-y-6 px-4 py-8">
          <div className="animate-fade-in-up">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-create-accent font-[family-name:var(--font-outfit)] transition-colors"
            >
              <Link href="/hypercerts">
                <ArrowLeft className="mr-2 size-4" />
                Back to Hypercerts
              </Link>
            </Button>
          </div>
          <div className="animate-fade-in-up">
            <div className="glass-panel border-border/50 space-y-3 rounded-2xl border p-8 text-center">
              <LogIn className="text-muted-foreground mx-auto size-8" />
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
                Please log in to view hypercerts.
              </p>
            </div>
          </div>
        </div>
      </main>
    );

  const parsed = parseAtUri(decodedUri);
  const certResult = parsed
    ? await viewCtx.agent.com.atproto.repo
        .getRecord({
          repo: parsed.did,
          collection: parsed.collection || "org.hypercerts.claim.activity",
          rkey: parsed.rkey,
        })
        .catch(() => null)
    : null;
  const rawValue = certResult?.data.value;
  if (!OrgHypercertsClaimActivity.isRecord(rawValue))
    return (
      <main className="noise-bg relative min-h-screen">
        <div className="gradient-mesh absolute inset-0 -z-10" />
        <div className="relative z-10 mx-auto max-w-4xl space-y-6 px-4 py-8">
          <div className="animate-fade-in-up">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-create-accent font-[family-name:var(--font-outfit)] transition-colors"
            >
              <Link href="/hypercerts">
                <ArrowLeft className="mr-2 size-4" />
                Back to Hypercerts
              </Link>
            </Button>
          </div>
          <div className="animate-fade-in-up">
            <div className="glass-panel space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <AlertCircle className="mx-auto size-8 text-red-400" />
              <p className="text-muted-foreground font-[family-name:var(--font-outfit)] text-sm">
                Record not found.
              </p>
            </div>
          </div>
        </div>
      </main>
    );

  const certRecord = rawValue as OrgHypercertsClaimActivity.Record;
  let imageUri: string | undefined;
  const { image, ...certWithoutImage } = certRecord;

  if (image && session) {
    const pdsUrl = await resolveSessionPds(session);
    imageUri = resolveHypercertImageUrl(image, ownerDid, pdsUrl);
  }

  const isOwner = Boolean(session?.did && ownerDid && session.did === ownerDid);

  return (
    <main className="noise-bg relative min-h-screen">
      <div className="gradient-mesh absolute inset-0 -z-10" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-6 px-4 py-8">
        {/* Back navigation */}
        <div className="animate-fade-in-up">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-create-accent font-[family-name:var(--font-outfit)] transition-colors"
          >
            <Link href="/hypercerts">
              <ArrowLeft className="mr-2 size-4" />
              Back to Hypercerts
            </Link>
          </Button>
        </div>

        <HypercertDetailsView
          hypercertUri={decodedUri}
          record={certWithoutImage}
          imageUri={imageUri}
          isOwner={isOwner}
        />
      </div>
    </main>
  );
}
