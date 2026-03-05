import { getRepoContext } from "@/lib/repo-context";
import { uploadContentBlob } from "@/lib/atproto-writes";
import {
  parseAtUri,
  getStringField,
  stringToLinearDocument,
} from "@/lib/utils";
import { assertValidRecord } from "@/lib/record-validation";
import {
  processContributions,
  type ContributionEntry,
} from "@/lib/contribution-helpers";
import { NextRequest, NextResponse } from "next/server";
import {
  OrgHypercertsClaimRights,
  OrgHypercertsClaimActivity,
  OrgHypercertsDefs,
} from "@hypercerts-org/lexicon";

interface HypercertRights {
  rightsName?: string;
  rightsType?: string;
  rightsDescription?: string;
}

interface HypercertParams {
  title: string;
  shortDescription: string;
  description: string;
  startDate: string;
  endDate: string;
  rights?: HypercertRights;
  image?: File;
  contributions?: Record<string, unknown>[];
  workScope?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const ctxPromise = getRepoContext();
    const title = getStringField(formData, "title");
    const shortDescription = getStringField(formData, "shortDescription");
    const description = getStringField(formData, "description");
    const startDate = getStringField(formData, "startDate");
    const endDate = getStringField(formData, "endDate");
    const rightsRaw = getStringField(formData, "rights");
    const workScopeRaw = getStringField(formData, "workScope");
    const contributionsRaw = getStringField(formData, "contributions");

    const image = formData.get("image") as File | null;

    if (!title || !shortDescription || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const parseOptionalJson = <T>(
      raw: string | null,
      field: string,
    ): T | undefined => {
      if (!raw) return undefined;
      try {
        return JSON.parse(raw) as T;
      } catch {
        throw new Error(`INVALID_JSON:${field}`);
      }
    };

    const rights = parseOptionalJson<HypercertRights>(rightsRaw, "rights");
    const contributions = parseOptionalJson<ContributionEntry[]>(
      contributionsRaw,
      "contributions",
    );

    const workScopeTags: string[] = workScopeRaw
      ? JSON.parse(workScopeRaw)
      : [];

    const hypercertParams: HypercertParams = {
      title,
      shortDescription,
      description: description ?? shortDescription,
      workScope: workScopeTags.length > 0 ? workScopeTags : undefined,
      startDate,
      endDate,
      rights,
      image: image || undefined,
    };

    const ctx = await ctxPromise;
    if (!ctx) {
      return NextResponse.json(
        { error: "Could not authenticate repo" },
        { status: 401 },
      );
    }

    // 1. Upload image if provided
    let imageField:
      | (OrgHypercertsDefs.SmallImage & {
          $type: "org.hypercerts.defs#smallImage";
        })
      | undefined;
    if (hypercertParams.image) {
      const blobRef = await uploadContentBlob(ctx.agent, hypercertParams.image);
      imageField = { $type: "org.hypercerts.defs#smallImage", image: blobRef };
    }

    // 2. Create rights record
    const rightsRecord: OrgHypercertsClaimRights.Record = {
      $type: "org.hypercerts.claim.rights",
      rightsName: hypercertParams.rights?.rightsName ?? "",
      rightsType: hypercertParams.rights?.rightsType ?? "",
      rightsDescription: hypercertParams.rights?.rightsDescription ?? "",
      createdAt: new Date().toISOString(),
    };
    try {
      assertValidRecord(
        "rights",
        rightsRecord,
        OrgHypercertsClaimRights.validateRecord,
      );
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Validation failed" },
        { status: 400 },
      );
    }
    const rightsResult = await ctx.agent.com.atproto.repo.createRecord({
      repo: ctx.activeDid,
      collection: "org.hypercerts.claim.rights",
      record: rightsRecord,
    });
    const rightsRef = {
      uri: rightsResult.data.uri,
      cid: rightsResult.data.cid,
    };

    // 3. Build the claim record
    const claimRecord: OrgHypercertsClaimActivity.Record = {
      $type: "org.hypercerts.claim.activity",
      title: hypercertParams.title,
      shortDescription: hypercertParams.shortDescription,
      description: hypercertParams.description
        ? stringToLinearDocument(hypercertParams.description)
        : undefined,
      startDate: hypercertParams.startDate,
      endDate: hypercertParams.endDate,
      rights: rightsRef,
      createdAt: new Date().toISOString(),
      ...(imageField ? { image: imageField } : {}),
      ...(hypercertParams.workScope && hypercertParams.workScope.length > 0
        ? {
            workScope: {
              $type: "org.hypercerts.claim.activity#workScopeString" as const,
              scope: hypercertParams.workScope.join(", "),
            },
          }
        : {}),
    };

    // 4. Create the claim record (PDS generates TID rkey)
    try {
      assertValidRecord(
        "activity",
        claimRecord,
        OrgHypercertsClaimActivity.validateRecord,
      );
      const claimResult = await ctx.agent.com.atproto.repo.createRecord({
        repo: ctx.activeDid,
        collection: "org.hypercerts.claim.activity",
        record: claimRecord,
      });

      // Process contributions best-effort — failure must not block the response
      if (contributions && contributions.length > 0) {
        await processContributions(
          ctx,
          claimResult.data.uri,
          contributions,
        ).catch((err: unknown) => {
          console.error("processContributions failed (non-fatal):", err);
        });
      }

      const data = {
        hypercertUri: claimResult.data.uri,
        hypercertCid: claimResult.data.cid,
        rightsUri: rightsResult.data.uri,
        rightsCid: rightsResult.data.cid,
      };
      return NextResponse.json(data);
    } catch (e) {
      // Compensating delete of orphaned rights record
      const parsedRights = parseAtUri(rightsResult.data.uri);
      if (parsedRights) {
        await ctx.agent.com.atproto.repo
          .deleteRecord({
            repo: ctx.activeDid,
            collection:
              parsedRights.collection || "org.hypercerts.claim.rights",
            rkey: parsedRights.rkey,
          })
          .catch(() => undefined); // best-effort cleanup
      }
      if (e instanceof Error && e.message.startsWith("Invalid")) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      throw e;
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("INVALID_JSON:")) {
      const field = e.message.split(":")[1];
      return NextResponse.json(
        { error: `Invalid JSON in ${field}` },
        { status: 400 },
      );
    }
    console.error("Error creating hypercert:", e);
    return NextResponse.json(
      { error: "Failed to create hypercert" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const ctxPromise = getRepoContext();
    const hypercertUri = getStringField(formData, "hypercertUri");

    if (!hypercertUri) {
      return NextResponse.json(
        { error: "Missing hypercertUri" },
        { status: 400 },
      );
    }

    const title = getStringField(formData, "title");
    const shortDescription = getStringField(formData, "shortDescription");
    const description = getStringField(formData, "description");
    const startDate = getStringField(formData, "startDate");
    const endDate = getStringField(formData, "endDate");
    const imageRaw = formData.get("image");

    const ctx = await ctxPromise;
    if (!ctx) {
      return NextResponse.json(
        { error: "Could not authenticate repo" },
        { status: 401 },
      );
    }

    const parsed = parseAtUri(hypercertUri);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid hypercertUri" },
        { status: 400 },
      );
    }
    if (parsed.did !== ctx.activeDid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build updates object with only provided fields
    const updates: Record<string, unknown> = {};
    if (title !== null) updates.title = title;
    if (shortDescription !== null) updates.shortDescription = shortDescription;
    if (description !== null)
      updates.description = stringToLinearDocument(description);
    if (startDate !== null && startDate !== "null")
      updates.startDate = startDate;
    if (endDate !== null && endDate !== "null") updates.endDate = endDate;

    // Handle image: File = new image, string "null" = remove, absent = no change
    let image: Blob | null | undefined;
    if (imageRaw instanceof File) {
      image = imageRaw;
    } else if (imageRaw === "null") {
      image = null;
    }

    // Fetch existing record
    const existingResult = await ctx.agent.com.atproto.repo.getRecord({
      repo: parsed.did,
      collection: parsed.collection || "org.hypercerts.claim.activity",
      rkey: parsed.rkey,
    });
    const existing = existingResult.data
      .value as OrgHypercertsClaimActivity.Record;

    // Merge updates into existing, preserving immutable fields
    const record: OrgHypercertsClaimActivity.Record = {
      ...existing,
      ...updates,
      $type: "org.hypercerts.claim.activity",
      createdAt: existing.createdAt, // immutable
      rights: existing.rights, // immutable
    };

    // Remove optional fields that were explicitly cleared (lexicon rejects null for non-nullable string fields)
    if (startDate === "null") delete record.startDate;
    if (endDate === "null") delete record.endDate;

    // Handle image
    if (image === null) {
      // Remove image
      delete record.image;
    } else if (image instanceof Blob) {
      // Upload new image
      const blobRef = await uploadContentBlob(ctx.agent, image);
      record.image = {
        $type: "org.hypercerts.defs#smallImage",
        image: blobRef,
      };
    }
    // else image === undefined → preserve existing (already in spread)

    try {
      assertValidRecord(
        "activity",
        record,
        OrgHypercertsClaimActivity.validateRecord,
      );
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Validation failed" },
        { status: 400 },
      );
    }
    const result = await ctx.agent.com.atproto.repo.putRecord({
      repo: ctx.activeDid,
      collection: parsed.collection || "org.hypercerts.claim.activity",
      rkey: parsed.rkey,
      record,
    });

    return NextResponse.json({ uri: result.data.uri, cid: result.data.cid });
  } catch (e) {
    console.error("Error updating hypercert:", e);
    return NextResponse.json(
      { error: "Failed to update hypercert" },
      { status: 500 },
    );
  }
}
