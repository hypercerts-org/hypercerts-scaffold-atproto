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
    const contentType =
      (data.get("contentType") as string | null)?.trim() ?? undefined;

    const evidenceMode =
      (data.get("evidenceMode") as string | null)?.trim() ?? "link";

    const hypercertUri =
      (data.get("hypercertUri") as string | null)?.trim() ?? undefined;

    if (!hypercertUri) {
      return NextResponse.json(
        { error: "Missing hypercertUri." },
        { status: 400 },
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
          { status: 400 },
        );
      }
      content = evidenceUrl;
    } else if (evidenceMode === "file") {
      const file = data.get("evidenceFile") as File | null;

      if (!file || file.size === 0) {
        return NextResponse.json(
          { error: "Missing evidenceFile for file mode." },
          { status: 400 },
        );
      }
      content = file;
    } else {
      return NextResponse.json(
        { error: `Invalid evidenceMode: ${evidenceMode}` },
        { status: 400 },
      );
    }

    const ctx = await getRepoContext(); // defaults targetDid=activeDid
    if (!ctx) {
      return NextResponse.json(
        { error: "Could not authenticate repo" },
        { status: 401 },
      );
    }

    // Parse location if provided
    let location: any = undefined;
    const locationMode = (data.get("locationMode") as string | null)?.trim();

    if (locationMode === "string") {
      const locationString = (
        data.get("locationString") as string | null
      )?.trim();
      if (locationString) {
        location = locationString;
      }
    } else if (locationMode === "create") {
      const lpVersion = (data.get("lpVersion") as string | null)?.trim();
      const srs = (data.get("srs") as string | null)?.trim();
      const locationType = (data.get("locationType") as string | null)?.trim();
      const locationContentMode = (
        data.get("locationContentMode") as string | null
      )?.trim();

      if (lpVersion && srs && locationType) {
        let locationData: string | File | undefined;

        if (locationContentMode === "link") {
          locationData = (data.get("locationUrl") as string | null)?.trim();
        } else if (locationContentMode === "file") {
          locationData = (data.get("locationFile") as File | null) ?? undefined;
        }

        if (locationData) {
          location = {
            lpVersion,
            srs,
            locationType,
            location: locationData,
            ...(data.get("locationName") && {
              name: (data.get("locationName") as string).trim(),
            }),
            ...(data.get("locationDescription") && {
              description: (data.get("locationDescription") as string).trim(),
            }),
          };
        }
      }
    }

    const response = await ctx.scopedRepo.hypercerts.addAttachment({
      subjects: hypercertUri,
      content,
      title,
      shortDescription,
      description,
      contentType: contentType as any,
      ...(location && { location }),
    });

    return NextResponse.json(response);
  } catch (e) {
    console.error("Error in add-attachment API:", e);
    return NextResponse.json(
      { error: `Failed to add attachment: ${(e as Error).message}` },
      { status: 500 },
    );
  }
}
