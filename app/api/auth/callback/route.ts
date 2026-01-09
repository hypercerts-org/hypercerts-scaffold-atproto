import sdk, { sessionStore, stateStore } from "@/lib/hypercerts-sdk";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

if (!process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error("Public app url not configured");
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  try {
    const session = await sdk.callback(searchParams);
    const cookieStore = await cookies();
    cookieStore.set("user-did", session.did, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL));
  } catch (e) {
    console.log("Authentication failed:", e);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
