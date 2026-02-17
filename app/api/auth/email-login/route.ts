import sdk from "@/lib/hypercerts-sdk";
import { config } from "@/lib/config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const email =
    body && typeof body === "object" && "email" in body
      ? (body as { email: unknown }).email
      : undefined;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const pdsUrl = config.pdsUrl;
    const baseAuthUrl = await sdk.authorize(pdsUrl);
    const authUrl = `${baseAuthUrl}&login_hint=${encodeURIComponent(email)}`;
    return NextResponse.json({ authUrl });
  } catch (e) {
    console.error("Failed to initiate login process", e);
    return NextResponse.json(
      { error: "Failed to initiate login process" },
      { status: 500 }
    );
  }
}
