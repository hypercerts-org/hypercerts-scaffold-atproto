import { getAuthenticatedRepo } from "@/lib/atproto-session";
import {
  HYPERCERT_COLLECTIONS,
  HypercertEvidence,
} from "@hypercerts-org/sdk-core";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();

    const title = (data.get("title") as string | null)?.trim() ?? "";
    const createdAt =
      (data.get("createdAt") as string | null)?.trim() ??
      new Date().toISOString();

    const shortDescription =
      (data.get("shortDescription") as string | null)?.trim() ?? undefined;
    const description =
      (data.get("description") as string | null)?.trim() ?? undefined;
    const relationType =
      (data.get("relationType") as string | null)?.trim() ?? undefined;

    const evidenceMode =
      (data.get("evidenceMode") as string | null)?.trim() ?? "link";

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
      $type: HYPERCERT_COLLECTIONS.EVIDENCE,
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
      const response = await personalRepository.hypercerts.addEvidence(
        hypercertUri || "",
        [evidenceRecord]
      );
      return NextResponse.json(response);
    }
  } catch (e) {
    console.error("Error in add-evidence API:", e);
    return NextResponse.json(
      { error: "Internal server error", details: (e as Error).message },
      { status: 500 }
    );
  }
}
