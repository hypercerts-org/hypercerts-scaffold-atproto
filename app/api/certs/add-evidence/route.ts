import { getRepoContext } from "@/lib/repo-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();

    const title = (data.get("title") as string | null)?.trim() ?? "";
    const shortDescription =
      (data.get("shortDescription") as string | null)?.trim() ?? undefined;
    const description =
      (data.get("description") as string | null)?.trim() ?? undefined;
    const relationType =
      (data.get("relationType") as string | null)?.trim() ?? undefined;

    const evidenceMode =
      (data.get("evidenceMode") as string | null)?.trim() ?? "link";

    const hypercertUri =
      (data.get("hypercertUri") as string | null)?.trim() ?? undefined;

    if (!hypercertUri) {
      return NextResponse.json(
        { error: "Missing hypercertUri." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json({ error: "Missing title." }, { status: 400 });
    }

    let content: string | Blob;

    if (evidenceMode === "link") {
      const evidenceUrl =
        (data.get("evidenceUrl") as string | null)?.trim() ?? "";

      if (!evidenceUrl) {
        return NextResponse.json(
          { error: "Missing evidenceUrl for link mode." },
          { status: 400 }
        );
      }
      content = evidenceUrl;
    } else if (evidenceMode === "file") {
      const file = data.get("evidenceFile") as File | null;

      if (!file || file.size === 0) {
        return NextResponse.json(
          { error: "Missing evidenceFile for file mode." },
          { status: 400 }
        );
      }
      content = file;
    } else {
      return NextResponse.json(
        { error: `Invalid evidenceMode: ${evidenceMode}` },
        { status: 400 }
      );
    }

    const ctx = await getRepoContext(); // defaults targetDid=activeDid
    if (!ctx) {
      return NextResponse.json(
        { error: "Could not authenticate repo" },
        { status: 401 }
      );
    }

    const response = await ctx.scopedRepo.hypercerts.addEvidence({
      subjectUri: hypercertUri,
      content,
      title,
      shortDescription,
      description,
      relationType: relationType as any,
    });

    return NextResponse.json(response);
  } catch (e) {
    console.error("Error in add-evidence API:", e);
    return NextResponse.json(
      { error: "Internal server error", details: (e as Error).message },
      { status: 500 }
    );
  }
}
