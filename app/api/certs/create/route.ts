import { getAuthenticatedRepo } from "@/lib/atproto-session";
import { CreateHypercertParams } from "@hypercerts-org/sdk-core";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const hypercertParams = (await req.json()) as CreateHypercertParams;
    const personalRepository = await getAuthenticatedRepo("pds");
    if (personalRepository) {
      const data = await personalRepository.hypercerts.create(hypercertParams);
      return NextResponse.json(data);
    }
  } catch (e) {
    console.error("Error creating hypercert:", e);
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Error creating hypercert" },
      { status: 500 }
    );
  }
}
