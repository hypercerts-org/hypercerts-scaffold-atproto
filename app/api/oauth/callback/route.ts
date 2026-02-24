import { NextRequest, NextResponse } from "next/server";
import {
  restoreDpopKeyPair,
  fetchWithDpopRetry,
} from "@/lib/epds-helpers";
import {
  getEpdsEndpoints,
  getEpdsClientId,
  getEpdsRedirectUri,
} from "@/lib/epds-config";
import {
  decodeEpdsSessionCookie,
  EPDS_SESSION_COOKIE_NAME,
} from "@/lib/epds-session-cookie";
import { sessionStore } from "@/lib/hypercerts-sdk";
import { config } from "@/lib/config";
import type { NodeSavedSession } from "@atproto/oauth-client-node";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // 1. Read code and state from query params
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing required query parameters: code and state" },
      { status: 400 },
    );
  }

  // 2. Read the epds-oauth-session cookie
  const cookieValue = req.cookies.get(EPDS_SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) {
    return NextResponse.json(
      { error: "No OAuth session found" },
      { status: 400 },
    );
  }

  // 3. Decode the session cookie
  let savedState: string;
  let codeVerifier: string;
  let dpopPrivateJwk: import("node:crypto").JsonWebKey;
  try {
    const sessionData = decodeEpdsSessionCookie(cookieValue);
    savedState = sessionData.state;
    codeVerifier = sessionData.codeVerifier;
    dpopPrivateJwk = sessionData.dpopPrivateJwk as import("node:crypto").JsonWebKey;
  } catch {
    return NextResponse.json(
      { error: "Invalid session cookie" },
      { status: 400 },
    );
  }

  // 4. Verify state matches
  if (state !== savedState) {
    return NextResponse.json(
      { error: "State mismatch" },
      { status: 400 },
    );
  }

  // 5. Restore DPoP key pair from the private JWK stored in the cookie
  const { privateKey, publicJwk } = restoreDpopKeyPair(dpopPrivateJwk);

  // 6. Get endpoints and client info
  const { tokenEndpoint } = getEpdsEndpoints();
  const clientId = getEpdsClientId();
  const redirectUri = getEpdsRedirectUri();

  // 7. Build token exchange body
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  // 8. Exchange code for tokens with DPoP retry
  const tokenResponse = await fetchWithDpopRetry(
    tokenEndpoint,
    tokenBody,
    privateKey,
    publicJwk,
  );

  // 9. Handle token exchange error
  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text().catch(() => tokenResponse.statusText);
    console.error("Token exchange failed:", tokenResponse.status, errorBody);
    return NextResponse.json(
      { error: "Token exchange failed", details: errorBody },
      { status: 502 },
    );
  }

  // 10. Parse token response
  const tokenData = (await tokenResponse.json()) as {
    access_token: string;
    token_type: string;
    scope?: string;
    expires_in?: number;
    sub: string;
    refresh_token?: string;
  };

  // 11. Construct NodeSavedSession and write to Redis
  // The issuer is the PDS origin (token endpoint without the /oauth/token path)
  const issuer = tokenEndpoint.replace("/oauth/token", "");

  // NodeSavedSession = Omit<Session, 'dpopKey'> & { dpopJwk: Jwk }
  // dpopJwk must be the private JWK (includes 'd' parameter) — SDK uses this for DPoP proofs
  // sub must be AtprotoDid (`did:plc:${string}` | `did:web:${string}`) — cast from token response
  // token_type must be 'DPoP' (capital D, capital P)
  // We cast via unknown to bridge node:crypto JsonWebKey → @atproto/jwk Jwk branded types
  const nodeSavedSession: NodeSavedSession = {
    dpopJwk: dpopPrivateJwk as unknown as NodeSavedSession["dpopJwk"],
    tokenSet: {
      iss: issuer,
      sub: tokenData.sub as unknown as NodeSavedSession["tokenSet"]["sub"],
      aud: issuer, // audience = PDS URL (same as issuer for ePDS users)
      scope: (tokenData.scope ?? "atproto transition:generic") as NodeSavedSession["tokenSet"]["scope"],
      access_token: tokenData.access_token,
      token_type: "DPoP" as const,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : undefined,
    },
  };

  await sessionStore.set(tokenData.sub, nodeSavedSession);

  // 12. Create redirect response to /
  const response = NextResponse.redirect(new URL("/", config.baseUrl));

  // 13. Set user-did cookie
  response.cookies.set("user-did", tokenData.sub, {
    httpOnly: true,
    secure: config.isProduction,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });

  // 14. Delete the epds-oauth-session cookie
  response.cookies.set(EPDS_SESSION_COOKIE_NAME, "", {
    maxAge: 0,
    path: "/",
  });

  return response;
}
