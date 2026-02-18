/**
 * OAuth Callback Handler — Compatible with certified.app (Certified PDS reverse proxy)
 *
 * VERIFICATION FINDINGS (hypercerts-scaffold-aou.3):
 *
 * This handler is fully generic and works with any ATProto-compliant OAuth provider,
 * including certified.app acting as a reverse proxy in front of the PDS. Here's why:
 *
 * 1. sdk.callback(searchParams) — The @hypercerts-org/sdk-core SDK handles all
 *    protocol details (PKCE code exchange, DPoP proof validation, state verification)
 *    internally. It does not care which PDS issued the authorization code.
 *
 * 2. redirect_uri — Registered in client-metadata.json as config.redirectUri
 *    (e.g. https://yourdomain.com/api/auth/callback). The PAR request sends this
 *    redirect_uri to certified.app, which passes it through to the PDS. The PDS
 *    redirects back to this exact URI after consent. No changes needed.
 *
 * 3. client-metadata.json — Served at {baseUrl}/client-metadata.json with no
 *    auth required. certified.app (and the PDS behind it) fetches this server-to-server
 *    to verify the OAuth client registration. No CORS headers needed (server-to-server).
 *
 * 4. jwks.json — Served at {baseUrl}/jwks.json. The PDS fetches this to verify
 *    DPoP proof signatures. Publicly accessible, no auth required.
 *
 * 5. Session storage — Redis-backed, keyed by DID. The DID is issued by the PDS
 *    regardless of whether certified.app is in the proxy chain. Works unchanged.
 *
 * 6. user-did cookie — Set from session.did, which is the user's canonical DID.
 *    Unaffected by the proxy architecture.
 *
 * CONCLUSION: No code changes required. The callback handler is compatible with
 * certified.app OAuth flows out of the box.
 *
 * WHAT TO TEST end-to-end:
 * - Initiate login with sdk.authorize('https://certified.app')
 * - certified.app shows OTP UI → user authenticates → PDS consent screen
 * - PDS redirects to this callback with ?code=...&state=...
 * - sdk.callback() exchanges code for DPoP-bound tokens
 * - Session stored in Redis, user-did cookie set, user redirected to /
 */

import sdk from "@/lib/hypercerts-sdk";
import { config } from "@/lib/config";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

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
    return NextResponse.json(
      {
        error: "Authentication failed",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}
