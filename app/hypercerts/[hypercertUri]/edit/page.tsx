import { redirect } from "next/navigation";
import { getSession } from "@/lib/atproto-session";
import { getRepoContext } from "@/lib/repo-context";
import { getBlobURL, extractDidFromAtUri } from "@/lib/utils";
import { resolveSessionPds } from "@/lib/server-utils";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrgHypercertsDefs } from "@hypercerts-org/sdk-core";
import HypercertsEditForm from "@/components/hypercerts-edit-form";

export default async function EditHypercertPage({
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

  if (!viewCtx || !session) {
    redirect(`/hypercerts/${hypercertUri}`);
  }

  // Ownership check — only the owner can edit
  if (session.did !== ownerDid) {
    redirect(`/hypercerts/${hypercertUri}`);
  }

  const cert = await viewCtx.scopedRepo.hypercerts.get(decodedUri);
  if (!cert?.record)
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

  let imageUri: string | undefined;
  const { image, ...certWithoutImage } = cert.record;

  if (image && session) {
    const pdsUrl = await resolveSessionPds(session);
    imageUri = getBlobURL(
      (image as OrgHypercertsDefs.SmallImage).image,
      ownerDid,
      pdsUrl,
    );
  }

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
            <Link href={`/hypercerts/${encodeURIComponent(decodedUri)}`}>
              <ArrowLeft className="mr-2 size-4" />
              Back to Hypercert
            </Link>
          </Button>
        </div>

        <div className="animate-fade-in-up">
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
            Edit Hypercert
          </h1>
        </div>

        <div className="animate-fade-in-up">
          <HypercertsEditForm
            hypercertUri={decodedUri}
            record={certWithoutImage}
            imageUri={imageUri}
          />
        </div>
      </div>
    </main>
  );
}
