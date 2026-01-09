import HypercertDetailsView from "@/components/hypercert-detail-view";
import { getAuthenticatedRepo, getSession } from "@/lib/atproto-session";
import { getBlobURL } from "@/lib/utils";

export default async function HypercertViewPage({
  params,
}: {
  params: Promise<{ hypercertUri: string }>;
}) {
  const { hypercertUri } = await params;
  const decodedUri = decodeURIComponent(hypercertUri);

  const personalRepo = await getAuthenticatedRepo();
  if (!personalRepo) return <div>Please log in to view hypercerts.</div>;

  const cert = await personalRepo.hypercerts.get(decodedUri);
  if (!cert?.record) return <div>Record not found</div>;
  let imageUri: string | undefined = undefined;
  const { image, ...certWithoutImage } = cert.record;
  if (image) {
    const session = await getSession();
    if (session) {
      const sessionIssuer = session.serverMetadata.issuer;
      imageUri = getBlobURL(image, session.did, sessionIssuer);
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
