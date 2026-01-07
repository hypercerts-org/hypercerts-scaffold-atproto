import { getAuthenticatedRepo } from "@/lib/atproto-session";
import { HypercertEvidence } from "@hypercerts-org/sdk-core";
import { NextRequest, NextResponse } from "next/server";

// import types if you want full typing:

export async function POST(req: NextRequest) {
  const data = await req.formData();

  const title = (data.get("title") as string | null)?.trim() ?? "";
  const createdAt =
    (data.get("createdAt") as string | null)?.trim() ??
    new Date().toISOString();

  // Optional fields
  const shortDescription =
    (data.get("shortDescription") as string | null)?.trim() ?? undefined;
  const description =
    (data.get("description") as string | null)?.trim() ?? undefined;
  const relationType =
    (data.get("relationType") as string | null)?.trim() ?? undefined;

  // Evidence mode
  const evidenceMode =
    (data.get("evidenceMode") as string | null)?.trim() ?? "link";

  // Subject (optional per interface)
  // If you're not providing a CID yet, you can leave subject undefined.
  const hypercertUri =
    (data.get("hypercertUri") as string | null)?.trim() ?? undefined;
  const hypercertCid =
    (data.get("hypercertCid") as string | null)?.trim() ?? undefined;

  const subject =
    hypercertUri && hypercertCid
      ? {
          uri: hypercertUri,
          cid: hypercertCid,
        }
      : undefined;

  // ---------- Build content ----------
  let content: HypercertEvidence["content"];

  if (evidenceMode === "link") {
    const evidenceUrl =
      (data.get("evidenceUrl") as string | null)?.trim() ?? "";

    if (!evidenceUrl) {
      return NextResponse.json(
        { error: "Missing evidenceUrl for link mode." },
        { status: 400 }
      );
    }

    content = {
      $type: "org.hypercerts.defs#uri",
      uri: evidenceUrl,
    };
  } else if (evidenceMode === "file") {
    const file = data.get("evidenceFile") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "Missing evidenceFile for file mode." },
        { status: 400 }
      );
    }

    content = {
      $type: "org.hypercerts.defs#uri",
      uri: "https://youchoseafilebutheresauri.com",
    };
  } else {
    return NextResponse.json(
      { error: `Invalid evidenceMode: ${evidenceMode}` },
      { status: 400 }
    );
  }

  if (!title) {
    return NextResponse.json({ error: "Missing title." }, { status: 400 });
  }
  const evidenceRecord: HypercertEvidence = {
    $type: "org.hypercerts.claim.evidence",
    subject,
    content,
    title,
    shortDescription,
    description,
    relationType: relationType as HypercertEvidence["relationType"],
    createdAt,
  };

  const personalRepository = await getAuthenticatedRepo();
  if (personalRepository) {
    personalRepository.hypercerts.addEvidence(hypercertUri || "", [
      evidenceRecord,
    ]);
  }

  // ✅ Return assembled object (you can now pass this into your SDK later)
  return NextResponse.json({
    evidenceRecord,
    receivedFields: [...data.entries()], // helpful for debugging
  });
}
