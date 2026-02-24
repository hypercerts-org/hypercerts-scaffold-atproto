import { NextRequest, NextResponse } from "next/server";
import {
  generateDpopKeyPair,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  fetchWithDpopRetry,
} from "@/lib/epds-helpers";
import {
  getEpdsEndpoints,
  getEpdsClientId,
  getEpdsRedirectUri,
} from "@/lib/epds-config";
import {
  encodeEpdsSessionCookie,
  EPDS_SESSION_COOKIE_NAME,
} from "@/lib/epds-session-cookie";
import { config } from "@/lib/config";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 0. Read optional email for login_hint (Flow 1)
    const email = req.nextUrl.searchParams.get("email");

    // 1. Generate PKCE + DPoP values
    const { privateKey, publicJwk, privateJwk } = generateDpopKeyPair();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // 3. Get endpoints and client info
    const { parEndpoint, authEndpoint } = getEpdsEndpoints();
    const clientId = getEpdsClientId();
    const redirectUri = getEpdsRedirectUri();

    // 4. Build PAR body
    const parBody = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "atproto transition:generic",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    // 5. Send PAR request with DPoP retry
    const parResponse = await fetchWithDpopRetry(
      parEndpoint,
      parBody,
      privateKey,
      publicJwk,
    );

    // 6. Handle PAR error
    if (!parResponse.ok) {
      const errorBody = await parResponse.text().catch(() => "(unreadable)");
      console.error("[oauth/login] PAR failed", parResponse.status, errorBody);
      return NextResponse.json(
        { error: `PAR request failed: ${parResponse.statusText}`, details: errorBody },
        { status: 502 },
      );
    }

    // 7. Parse request_uri from PAR response
    const { request_uri } = (await parResponse.json()) as {
      request_uri: string;
    };

    // 8. Encode session cookie
    const encodedCookie = encodeEpdsSessionCookie({
      state,
      codeVerifier,
      dpopPrivateJwk: privateJwk,
    });

    // 9. Build auth URL with all required params
    const authUrl = new URL(authEndpoint);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("request_uri", request_uri);
    if (email) {
      authUrl.searchParams.set("login_hint", email);
    }

    // 10. Create redirect response
    const response = NextResponse.redirect(authUrl.toString());

    // 11. Set session cookie
    response.cookies.set(EPDS_SESSION_COOKIE_NAME, encodedCookie, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    // 12. Return redirect response
    return response;
  } catch (error) {
    console.error("[oauth/login] Unexpected error:", error);
    return NextResponse.redirect(new URL("/?error=auth_failed", config.baseUrl));
  }
}
