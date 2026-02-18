import sdk from "@/lib/hypercerts-sdk";
import { config } from "@/lib/config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const mode = body.mode as string | undefined;
  const handle = body.handle as string | undefined;

  // Determine the target to authorize against
  const target =
    mode === "certified" ? config.certifiedPdsUrl : handle;

  if (!target) {
    return Response.json(
      { error: "Either 'handle' or mode: 'certified' is required" },
      { status: 400 }
    );
  }

  try {
    const authUrl = await sdk.authorize(target);
    return NextResponse.json({ authUrl });
  } catch (e) {
    console.error("Failed to initiate login process", e);
    return Response.json(
      { error: "Failed to initiate login process" },
      { status: 500 }
    );
  }
}
