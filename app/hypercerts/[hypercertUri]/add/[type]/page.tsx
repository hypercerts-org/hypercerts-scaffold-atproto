import { redirect } from "next/navigation";
import { getSession } from "@/lib/atproto-session";
import AddRecordForm from "@/components/add-record-form";
import { extractDidFromAtUri } from "@/lib/utils";

export default async function AddRecordPage({
  params,
}: {
  params: Promise<{ hypercertUri: string; type: string }>;
}) {
  const { hypercertUri, type } = await params;
  const decodedUri = decodeURIComponent(hypercertUri);

  const ownerDid = extractDidFromAtUri(decodedUri);
  if (!ownerDid) return <div>Invalid hypercert URI.</div>;

  const session = await getSession();

  if (!session) {
    redirect(`/hypercerts/${hypercertUri}`);
  }

  // Ownership check — only the owner can add records
  if (session.did !== ownerDid) {
    redirect(`/hypercerts/${hypercertUri}`);
  }

  return <AddRecordForm hypercertUri={decodedUri} type={type} />;
}
