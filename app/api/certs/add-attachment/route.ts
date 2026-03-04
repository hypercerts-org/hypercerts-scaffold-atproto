import { getRepoContext } from "@/lib/repo-context";
import {
  resolveStrongRef,
  createLocationRecord,
  uploadContentBlob,
  type LocationCreateParams,
} from "@/lib/atproto-writes";
import { getStringField, parseAtUri } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import {
  OrgHypercertsClaimAttachment,
  OrgHypercertsDefs,
} from "@hypercerts-org/lexicon";
import { assertValidRecord } from "@/lib/record-validation";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const ctxPromise = getRepoContext();

    const title = getStringField(data, "title")?.trim() ?? "";
    const shortDescription =
      getStringField(data, "shortDescription")?.trim() ?? undefined;
    const description =
      getStringField(data, "description")?.trim() ?? undefined;
    const contentType =
      getStringField(data, "contentType")?.trim() ?? undefined;

    const evidenceMode = getStringField(data, "evidenceMode")?.trim() ?? "link";

    const hypercertUri =
      getStringField(data, "hypercertUri")?.trim() ?? undefined;

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
      const evidenceUrl = getStringField(data, "evidenceUrl")?.trim() ?? "";

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

    const ctx = await ctxPromise; // defaults targetDid=activeDid
    if (!ctx) {
      return NextResponse.json(
        { error: "Could not authenticate repo" },
        { status: 401 },
      );
    }

    // Parse location if provided
    let location:
      | string
      | {
          lpVersion: string;
          srs: string;
          locationType: string;
          location: string | File;
          name?: string;
          description?: string;
        }
      | undefined = undefined;
    const locationMode = getStringField(data, "locationMode")?.trim();

    if (locationMode === "string") {
      const locationString = getStringField(data, "locationString")?.trim();
      if (locationString) {
        location = locationString;
      }
    } else if (locationMode === "create") {
      const lpVersion = getStringField(data, "lpVersion")?.trim();
      const srs = getStringField(data, "srs")?.trim();
      const locationType = getStringField(data, "locationType")?.trim();
      const locationContentMode = getStringField(
        data,
        "locationContentMode",
      )?.trim();

      if (lpVersion && srs && locationType) {
        let locationData: string | File | undefined;

        if (locationContentMode === "link") {
          locationData = getStringField(data, "locationUrl")?.trim();
        } else if (locationContentMode === "file") {
          locationData = (data.get("locationFile") as File | null) ?? undefined;
        }

        if (locationData) {
          location = {
            lpVersion,
            srs,
            locationType,
            location: locationData,
            ...(getStringField(data, "locationName") && {
              name: getStringField(data, "locationName")!.trim(),
            }),
            ...(getStringField(data, "locationDescription") && {
              description: getStringField(data, "locationDescription")!.trim(),
            }),
          };
        }
      }
    }

    // 1. Resolve subject to StrongRef
    const subjectRef = await resolveStrongRef(
      ctx.agent,
      hypercertUri,
      "org.hypercerts.claim.activity",
    );

    // 2. Resolve content — string URL or uploaded blob
    let contentField:
      | (OrgHypercertsDefs.Uri & { $type: "org.hypercerts.defs#uri" })
      | (OrgHypercertsDefs.SmallBlob & {
          $type: "org.hypercerts.defs#smallBlob";
        });
    if (typeof content === "string") {
      contentField = { $type: "org.hypercerts.defs#uri", uri: content };
    } else {
      // content is a Blob/File
      const blobRef = await uploadContentBlob(ctx.agent, content);
      contentField = { $type: "org.hypercerts.defs#smallBlob", blob: blobRef };
    }

    // 3. Optionally create location record
    let locationRef: { uri: string; cid: string } | undefined;
    let createdLocationRef: { uri: string; cid: string } | undefined;
    if (location) {
      if (typeof location === "string") {
        locationRef = await resolveStrongRef(
          ctx.agent,
          location,
          "app.certified.location",
        );
      } else {
        locationRef = await createLocationRecord(
          ctx.agent,
          ctx.activeDid,
          location as LocationCreateParams,
        );
        createdLocationRef = locationRef;
      }
    }

    // 4. Build attachment record
    const record: OrgHypercertsClaimAttachment.Record = {
      $type: "org.hypercerts.claim.attachment",
      subjects: [subjectRef],
      content: [contentField],
      title,
      createdAt: new Date().toISOString(),
      ...(shortDescription ? { shortDescription } : {}),
      ...(description ? { description } : {}),
      ...(contentType ? { contentType } : {}),
      ...(locationRef ? { location: locationRef } : {}),
    };

    try {
      assertValidRecord(
        "attachment",
        record,
        OrgHypercertsClaimAttachment.validateRecord,
      );

      const result = await ctx.agent.com.atproto.repo.createRecord({
        repo: ctx.activeDid,
        collection: "org.hypercerts.claim.attachment",
        record,
      });

      return NextResponse.json({ uri: result.data.uri, cid: result.data.cid });
    } catch (e) {
      // Best-effort: compensate orphaned location record if we created one
      if (createdLocationRef) {
        const parsed = parseAtUri(createdLocationRef.uri);
        if (parsed) {
          await ctx.agent.com.atproto.repo
            .deleteRecord({
              repo: ctx.activeDid,
              collection: parsed.collection || "app.certified.location",
              rkey: parsed.rkey,
            })
            .catch(() => undefined);
        }
      }

      // Validation errors return 400; other errors re-throw
      if (
        e instanceof Error &&
        e.message.startsWith("Invalid attachment record")
      ) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      throw e;
    }
  } catch (e) {
    console.error("Error in add-attachment API:", e);
    return NextResponse.json(
      {
        error: `Failed to add attachment: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 },
    );
  }
}
