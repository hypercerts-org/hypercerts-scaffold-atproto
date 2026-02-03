import type { Metadata } from "next";
import HypercertDetailsView from "@/components/hypercert-detail-view";
import { getSession } from "@/lib/atproto-session";
import { getRepoContext } from "@/lib/repo-context";
import { getBlobURL } from "@/lib/utils";

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

  const viewCtx = await getRepoContext({ targetDid: ownerDid });
  if (!viewCtx) return <div>Please log in to view hypercerts.</div>;

  const cert = await viewCtx.scopedRepo.hypercerts.get(decodedUri);
  if (!cert?.record) return <div>Record not found</div>;

  let imageUri: string | undefined;
  const { image, ...certWithoutImage } = cert.record;

  if (image) {
    const session = await getSession();
    if (session) {
      const sessionIssuer = session.serverMetadata.issuer;

      const blobBase =
        ownerDid === viewCtx.userDid
          ? sessionIssuer
          : process.env.NEXT_PUBLIC_SDS_URL || sessionIssuer;

      imageUri = getBlobURL(image, ownerDid, blobBase);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <HypercertDetailsView
        hypercertUri={decodedUri}
        record={certWithoutImage}
        imageUri={imageUri}
      />
    </div>
  );
}
