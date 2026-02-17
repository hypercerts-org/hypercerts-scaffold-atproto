import sdk from "@/lib/hypercerts-sdk";
import { config } from "@/lib/config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const error = searchParams.get("error");
  if (error) {
    const description = searchParams.get("error_description") || "Authorization was cancelled";
    console.warn("OAuth authorization error:", error, description);
    const redirectUrl = new URL("/", config.baseUrl);
    redirectUrl.searchParams.set("auth_error", error);
    redirectUrl.searchParams.set("auth_error_description", description);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const session = await sdk.callback(searchParams);
    const cookieStore = await cookies();
    cookieStore.set("user-did", session.did, {
      httpOnly: true,
      secure: config.isProduction,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    // The return_to parameter can be set by the login flow to preserve user's location
    const returnTo = searchParams.get("return_to") || "/";

    // Validate returnTo is a relative path (security: prevent open redirect)
    const redirectPath = returnTo.startsWith("/") ? returnTo : "/";

    return NextResponse.redirect(new URL(redirectPath, config.baseUrl));
  } catch (e) {
    console.error("Authentication failed:", e);
    const redirectUrl = new URL("/", config.baseUrl);
    redirectUrl.searchParams.set("auth_error", "callback_failed");
    redirectUrl.searchParams.set("auth_error_description", "Authentication failed. Please try again.");
    return NextResponse.redirect(redirectUrl);
  }
}
