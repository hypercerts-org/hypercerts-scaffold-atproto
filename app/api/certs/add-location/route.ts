import { getAgent } from "@/lib/atproto-session";
import {
  createLocationRecord,
  type LocationCreateParams,
} from "@/lib/atproto-writes";
import { parseAtUri, getStringField } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { OrgHypercertsClaimActivity } from "@hypercerts-org/lexicon";
import { assertValidRecord } from "@/lib/record-validation";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const repoPromise = getAgent();

    const hypercertUri = getStringField(data, "hypercertUri")?.trim();
    const srs = getStringField(data, "srs")?.trim();
    const contentMode = getStringField(data, "contentMode")?.trim() ?? "link";

    const name = getStringField(data, "name")?.trim() ?? undefined;
    const description =
      getStringField(data, "description")?.trim() ?? undefined;

    const locationType = getStringField(data, "locationType")?.trim();
    const lpVersion = getStringField(data, "lpVersion")?.trim();

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

    let locationPayload: LocationCreateParams;
    if (contentMode === "link") {
      const locationUrl = getStringField(data, "locationUrl")?.trim();

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

    // 1. Create location record
    const locationRef = await createLocationRecord(
      personalRepository,
      personalRepository.assertDid,
      locationPayload as LocationCreateParams,
    );

    // 2. Fetch existing hypercert and append location
    const hypercertParsed = parseAtUri(hypercertUri);
    if (!hypercertParsed) throw new Error("Invalid hypercertUri");

    if (hypercertParsed.did !== personalRepository.assertDid) {
      return NextResponse.json(
        { error: "Cannot modify another user's hypercert" },
        { status: 403 },
      );
    }

    const existingResult = await personalRepository.com.atproto.repo.getRecord({
      repo: hypercertParsed.did,
      collection: hypercertParsed.collection || "org.hypercerts.claim.activity",
      rkey: hypercertParsed.rkey,
    });
    const existingRecord = existingResult.data
      .value as OrgHypercertsClaimActivity.Record;

    const existingLocations = existingRecord.locations ?? [];
    existingRecord.locations = [...existingLocations, locationRef];

    // 3. Update hypercert
    try {
      assertValidRecord(
        "activity",
        existingRecord,
        OrgHypercertsClaimActivity.validateRecord,
      );
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Validation failed" },
        { status: 400 },
      );
    }

    await personalRepository.com.atproto.repo.putRecord({
      repo: personalRepository.assertDid,
      collection: hypercertParsed.collection || "org.hypercerts.claim.activity",
      rkey: hypercertParsed.rkey,
      record: existingRecord,
    });

    return NextResponse.json(locationRef);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("Error in add-location API:", detail);
    return NextResponse.json(
      {
        error: `Failed to add location: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 },
    );
  }
}
