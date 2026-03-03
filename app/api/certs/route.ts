import { getRepoContext } from "@/lib/repo-context";
import { uploadContentBlob } from "@/lib/atproto-writes";
import { parseAtUri } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

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
    const title = formData.get("title") as string | null;
    const shortDescription = formData.get("shortDescription") as string | null;
    const description = formData.get("description") as string | null;
    const startDate = formData.get("startDate") as string | null;
    const endDate = formData.get("endDate") as string | null;
    const rightsRaw = formData.get("rights") as string | null;
    // TODO map to proper workscope
    // // const workScopeRaw = formData.get("workScope") as string | null;
    const contributionsRaw = formData.get("contributions") as string | null;

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
    // TODO: process contributions after creation via addContribution
    parseOptionalJson<Record<string, unknown>[]>(
      contributionsRaw,
      "contributions",
    );

    const hypercertParams: HypercertParams = {
      title,
      shortDescription,
      description: description ?? shortDescription,
      // workScope,
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
    let imageField: Record<string, unknown> | undefined;
    if (hypercertParams.image) {
      const blobRef = await uploadContentBlob(ctx.agent, hypercertParams.image);
      imageField = { $type: "org.hypercerts.defs#smallImage", image: blobRef };
    }

    // 2. Create rights record
    const rightsRecord: Record<string, unknown> = {
      $type: "org.hypercerts.claim.rights",
      createdAt: new Date().toISOString(),
    };
    if (hypercertParams.rights) {
      if (hypercertParams.rights.rightsName)
        rightsRecord.rightsName = hypercertParams.rights.rightsName;
      if (hypercertParams.rights.rightsType)
        rightsRecord.rightsType = hypercertParams.rights.rightsType;
      if (hypercertParams.rights.rightsDescription)
        rightsRecord.rightsDescription =
          hypercertParams.rights.rightsDescription;
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
    const claimRecord: Record<string, unknown> = {
      $type: "org.hypercerts.claim.activity",
      title: hypercertParams.title,
      shortDescription: hypercertParams.shortDescription,
      description: hypercertParams.description,
      startDate: hypercertParams.startDate,
      endDate: hypercertParams.endDate,
      rights: rightsRef,
      workScope: hypercertParams.workScope || [],
      createdAt: new Date().toISOString(),
    };
    if (imageField) claimRecord.image = imageField;

    // 4. Create the claim record (PDS generates TID rkey)
    const claimResult = await ctx.agent.com.atproto.repo.createRecord({
      repo: ctx.activeDid,
      collection: "org.hypercerts.claim.activity",
      record: claimRecord,
    });

    const data = {
      hypercertUri: claimResult.data.uri,
      hypercertCid: claimResult.data.cid,
      rightsUri: rightsResult.data.uri,
      rightsCid: rightsResult.data.cid,
    };
    return NextResponse.json(data);
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
    const hypercertUri = formData.get("hypercertUri") as string | null;

    if (!hypercertUri) {
      return NextResponse.json(
        { error: "Missing hypercertUri" },
        { status: 400 },
      );
    }

    const title = formData.get("title") as string | null;
    const shortDescription = formData.get("shortDescription") as string | null;
    const description = formData.get("description") as string | null;
    const startDate = formData.get("startDate") as string | null;
    const endDate = formData.get("endDate") as string | null;
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
    if (description !== null) updates.description = description;
    if (startDate === "null") updates.startDate = null;
    else if (startDate !== null) updates.startDate = startDate;
    if (endDate === "null") updates.endDate = null;
    else if (endDate !== null) updates.endDate = endDate;

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
    const existing = existingResult.data.value as Record<string, unknown>;

    // Merge updates into existing, preserving immutable fields
    const record: Record<string, unknown> = {
      ...existing,
      ...updates,
      $type: "org.hypercerts.claim.activity",
      createdAt: existing.createdAt, // immutable
      rights: existing.rights, // immutable
    };

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
