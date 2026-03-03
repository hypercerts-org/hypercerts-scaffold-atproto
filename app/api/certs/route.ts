import { getRepoContext } from "@/lib/repo-context";
import { parseAtUri } from "@/lib/utils";
import { CreateHypercertParams } from "@hypercerts-org/sdk-core";
import { NextRequest, NextResponse } from "next/server";

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

    const rights = parseOptionalJson<CreateHypercertParams["rights"]>(
      rightsRaw,
      "rights",
    );
    const contributions = parseOptionalJson<
      CreateHypercertParams["contributions"]
    >(contributionsRaw, "contributions");

    const hypercertParams: CreateHypercertParams = {
      title,
      shortDescription,
      description: description ?? shortDescription,
      // workScope,
      startDate,
      endDate,
      rights: rights as CreateHypercertParams["rights"],
      image: image || undefined,
      contributions,
    };

    const ctx = await ctxPromise;
    if (!ctx) {
      return NextResponse.json(
        { error: "Could not authenticate repo" },
        { status: 401 },
      );
    }

    // @ts-expect-error -- Phase 2-4 migration: ctx.scopedRepo no longer exists, migrating to native atproto in Phase 2-4
    const data = await ctx.scopedRepo.hypercerts.create(hypercertParams);
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

    // @ts-expect-error -- Phase 2-4 migration: ctx.scopedRepo no longer exists, migrating to native atproto in Phase 2-4
    const data = await ctx.scopedRepo.hypercerts.update({
      uri: hypercertUri,
      updates,
      image,
    });
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating hypercert:", e);
    return NextResponse.json(
      { error: "Failed to update hypercert" },
      { status: 500 },
    );
  }
}
