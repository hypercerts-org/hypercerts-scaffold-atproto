import { getAuthenticatedRepo } from "@/lib/atproto-session";
import { LocationParams } from "@hypercerts-org/sdk-core";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const repoPromise = getAuthenticatedRepo();

    const hypercertUri = (data.get("hypercertUri") as string | null)?.trim();
    const srs = (data.get("srs") as string | null)?.trim();
    const contentMode =
      (data.get("contentMode") as string | null)?.trim() ?? "link";

    const name = (data.get("name") as string | null)?.trim() ?? undefined;
    const description =
      (data.get("description") as string | null)?.trim() ?? undefined;

    const locationType = (data.get("locationType") as string | null)?.trim();
    const lpVersion = (data.get("lpVersion") as string | null)?.trim();

    if (!locationType || !lpVersion || !srs) {
      return NextResponse.json(
        {
          error: `Missing${!locationType ? " locationType" : ""}${!lpVersion ? " lpVersion" : ""}${!srs ? " srs" : ""}`,
        },
        { status: 400 },
      );
    }

    if (!hypercertUri) {
      return NextResponse.json(
        { error: "Missing hypercertUri." },
        { status: 400 },
      );
    }

    let locationPayload: LocationParams;
    if (contentMode === "link") {
      const locationUrl = (data.get("locationUrl") as string | null)?.trim();

      if (!locationUrl) {
        return NextResponse.json(
          { error: "Missing locationUrl for link mode." },
          { status: 400 },
        );
      }

      locationPayload = {
        lpVersion,
        srs,
        locationType,
        location: locationUrl,
        name,
        description,
      };
    } else if (contentMode === "file") {
      const file = data.get("locationFile") as File | null;

      if (!file || file.size === 0) {
        return NextResponse.json(
          { error: "Missing locationFile for file mode." },
          { status: 400 },
        );
      }

      locationPayload = {
        lpVersion,
        srs,
        locationType,
        location: file,
      };
    } else {
      return NextResponse.json(
        { error: `Invalid contentMode: ${contentMode}` },
        { status: 400 },
      );
    }

    const personalRepository = await repoPromise;
    if (!personalRepository) {
      return NextResponse.json(
        { error: "Could not authenticate repo" },
        { status: 401 },
      );
    }

    const result = await personalRepository.hypercerts.attachLocation(
      hypercertUri,
      locationPayload,
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error("Error in add-location API:", e);
    return NextResponse.json(
      { error: "Internal server error", details: (e as Error).message },
      { status: 500 },
    );
  }
}
