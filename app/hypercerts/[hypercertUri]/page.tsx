import HypercertDetailsView from "@/components/hypercert-detail-view";
import { getSession } from "@/lib/atproto-session";
import { getRepoContext } from "@/lib/repo-context";
import { getBlobURL } from "@/lib/utils";

function extractDidFromAtUri(atUri: string): string | null {
  // Expected: at://<did>/<collection>/<rkey>
  const match = atUri.match(/^at:\/\/([^/]+)\/([^/]+)\/(.+)$/);
  return match ? match[1] : null;
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
    const sessionIssuer = session.serverMetadata.issuer;

    const blobBase =
      ownerDid === viewCtx.userDid
        ? sessionIssuer
        : process.env.NEXT_PUBLIC_SDS_URL || sessionIssuer;

    imageUri = getBlobURL(image, ownerDid, blobBase);
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
