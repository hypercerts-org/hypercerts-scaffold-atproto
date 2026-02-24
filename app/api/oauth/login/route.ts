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
  // 1. Read email from query params
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json(
      { error: "Missing required query parameter: email" },
      { status: 400 },
    );
  }

  // 2. Generate PKCE + DPoP values
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
    login_hint: email,
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
    return NextResponse.json(
      { error: `PAR request failed: ${parResponse.statusText}` },
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
  const authUrl = `${authEndpoint}?client_id=${encodeURIComponent(clientId)}&request_uri=${encodeURIComponent(request_uri)}&login_hint=${encodeURIComponent(email)}`;

  // 10. Create redirect response
  const response = NextResponse.redirect(authUrl);

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
}
