import sdk from "@/lib/hypercerts-sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const handle = body.handle;
  try {
    const authUrl = await sdk.authorize(handle);
    return NextResponse.json({ authUrl });
  } catch (e) {
    console.error("Failed to initiate login process", e);
    return Response.json(
      { error: "Failed to initiate login process" },
      { status: 500 }
    );
  }
}
