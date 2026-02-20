import { getRepoContext } from "@/lib/repo-context";
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

    const rights = rightsRaw ? JSON.parse(rightsRaw) : undefined;
    const contributions = contributionsRaw
      ? JSON.parse(contributionsRaw)
      : undefined;

    const hypercertParams: CreateHypercertParams = {
      title,
      shortDescription,
      description: description ?? shortDescription,
      // workScope,
      startDate,
      endDate,
      rights,
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

    const data = await ctx.scopedRepo.hypercerts.create(hypercertParams);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error creating hypercert:", e);
    return NextResponse.json(
      { error: "Failed to create hypercert" },
      { status: 500 },
    );
  }
}
