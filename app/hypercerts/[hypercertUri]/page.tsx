import type { Metadata } from "next";
import HypercertDetailsView from "@/components/hypercert-detail-view";
import { getSession } from "@/lib/atproto-session";
import { getRepoContext } from "@/lib/repo-context";
import { getBlobURL } from "@/lib/utils";
import { resolveSessionPds } from "@/lib/server-utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrgHypercertsDefs } from "@hypercerts-org/sdk-core";

function extractDidFromAtUri(atUri: string): string | null {
  // Expected: at://<did>/<collection>/<rkey>
  const match = atUri.match(/^at:\/\/([^/]+)\/([^/]+)\/(.+)$/);
  return match ? match[1] : null;
}

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

    const cert = await viewCtx.scopedRepo.hypercerts.get(decodedUri);
    if (!cert?.record) {
      return { title: "Hypercert Not Found" };
    }

    const title = cert.record.title || "Hypercert";
    const description =
      cert.record.shortDescription || "View this hypercert impact claim.";

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
  if (!ownerDid) return <div>Invalid hypercert URI.</div>;

  const [viewCtx, session] = await Promise.all([
    getRepoContext({ targetDid: ownerDid }),
    getSession(),
  ]);
  if (!viewCtx) return <div>Please log in to view hypercerts.</div>;

  const cert = await viewCtx.scopedRepo.hypercerts.get(decodedUri);
  if (!cert?.record) return <div>Record not found</div>;

  let imageUri: string | undefined;
  const { image, ...certWithoutImage } = cert.record;

  if (image && session) {
    const pdsUrl = await resolveSessionPds(session);

    // TODO: check for uri and image types. for now we will assume its a small iamge
    imageUri = getBlobURL(
      (image as OrgHypercertsDefs.SmallImage).image,
      ownerDid,
      pdsUrl,
    );
    console.log(imageUri);
  }

  return (
    <main className="relative min-h-screen noise-bg">
      <div className="gradient-mesh absolute inset-0 -z-10" />

      <div className="relative z-10 max-w-4xl mx-auto py-8 px-4 space-y-6">
        {/* Back navigation */}
        <div className="animate-fade-in-up">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="font-[family-name:var(--font-outfit)] text-muted-foreground hover:text-create-accent transition-colors"
          >
            <Link href="/hypercerts">
              <ArrowLeft className="size-4 mr-2" />
              Back to Hypercerts
            </Link>
          </Button>
        </div>

        <HypercertDetailsView
          hypercertUri={decodedUri}
          record={certWithoutImage}
          imageUri={imageUri}
        />
      </div>
    </main>
  );
}
