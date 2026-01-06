import sdk, { sessionStore, stateStore } from "@/lib/hypercerts-sdk";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  console.log("session store", sessionStore);
  console.log("state store", stateStore);
  try {
    const session = await sdk.callback(searchParams);
    console.log("Authenticated session:", session);
    const cookieStore = await cookies();
    cookieStore.set("user-did", session.did, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (e) {
    console.log("Authentication failed:", e);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
