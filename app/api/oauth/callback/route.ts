import oauthClient, {
  sessionIdStore,
  sessionStore,
} from "@/lib/hypercerts-sdk";
import { config } from "@/lib/config";
import {
  generateSessionId,
  LEGACY_ACTIVE_DID_COOKIE_NAME,
  LEGACY_USER_DID_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/session-cookie";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const error = searchParams.get("error");
  if (error) {
    const rawDescription = searchParams.get("error_description");
    console.warn("OAuth authorization error:", error, rawDescription);
    const trimmed = rawDescription?.trim() ?? "";
    const sanitizedDescription =
      trimmed.length === 0
        ? "Authorization was cancelled"
        : trimmed.length > 200
          ? trimmed.slice(0, 200) + "..."
          : trimmed;
    const redirectUrl = new URL("/", config.baseUrl);
    redirectUrl.searchParams.set("auth_error", error);
    redirectUrl.searchParams.set(
      "auth_error_description",
      sanitizedDescription,
    );
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const [result, cookieStore] = await Promise.all([
      oauthClient.callback(searchParams),
      cookies(),
    ]);
    const { session } = result;
    const previousSessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (previousSessionId) {
      const previousDid = await sessionIdStore.get(previousSessionId);
      await sessionIdStore.del(previousSessionId);
      if (previousDid && previousDid !== session.did) {
        const previousSession = await oauthClient
          .restore(previousDid)
          .catch(() => null);
        await previousSession?.signOut().catch(() => null);
        await sessionStore.del(previousDid);
      }
    }

    const sessionId = generateSessionId();
    await sessionIdStore.set(sessionId, session.did);
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);
    cookieStore.delete(LEGACY_USER_DID_COOKIE_NAME);
    cookieStore.delete(LEGACY_ACTIVE_DID_COOKIE_NAME);

    // The return_to parameter can be set by the login flow to preserve user's location
    const returnTo = searchParams.get("return_to") || "/";

    // Validate returnTo is same-origin (security: prevent open redirect via //evil.com)
    const resolved = new URL(returnTo, config.baseUrl);
    const base = new URL(config.baseUrl);
    const redirectPath =
      resolved.origin === base.origin
        ? resolved.pathname + resolved.search
        : "/";

    return NextResponse.redirect(new URL(redirectPath, config.baseUrl));
  } catch (e) {
    console.error("Authentication failed:", e);
    const redirectUrl = new URL("/", config.baseUrl);
    redirectUrl.searchParams.set("auth_error", "callback_failed");
    redirectUrl.searchParams.set(
      "auth_error_description",
      "Authentication failed. Please try again.",
    );
    return NextResponse.redirect(redirectUrl);
  }
}
