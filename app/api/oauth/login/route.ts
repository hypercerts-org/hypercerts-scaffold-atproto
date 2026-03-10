import oauthClient from "@/lib/hypercerts-sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const handle = (body as Record<string, unknown>).handle;
  if (!handle || typeof handle !== "string") {
    return Response.json(
      { error: "Missing or invalid handle" },
      { status: 400 },
    );
  }
  try {
    const authUrl = await oauthClient.authorize(handle);
    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (e) {
    console.error("Failed to initiate login process", e);
    return Response.json(
      { error: "Failed to initiate login process" },
      { status: 500 },
    );
  }
}
