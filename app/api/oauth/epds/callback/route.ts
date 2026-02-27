import { NextRequest, NextResponse } from "next/server";
import { restoreDpopKeyPair, fetchWithDpopRetry } from "@/lib/epds-helpers";
import {
  getEpdsEndpoints,
  getEpdsClientId,
  getEpdsRedirectUri,
} from "@/lib/epds-config";
import { sessionStore, epdsStateStore } from "@/lib/hypercerts-sdk";
import { config, OAUTH_SCOPE } from "@/lib/config";
import type { NodeSavedSession } from "@atproto/oauth-client-node";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Read code and state from query params
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    if (!code || !state) {
      console.error(
        "[oauth/epds/callback] Missing required query parameters: code and state",
      );
      return NextResponse.redirect(
        new URL("/?error=auth_failed", config.baseUrl),
      );
    }

    // 2. Retrieve OAuth state from Redis
    const oauthState = await epdsStateStore.get(state);
    if (!oauthState) {
      console.error(
        "[oauth/epds/callback] No OAuth state found in Redis for state:",
        state,
      );
      return NextResponse.redirect(
        new URL("/?error=auth_failed", config.baseUrl),
      );
    }

    const { codeVerifier, dpopPrivateJwk } = oauthState;

    // 5. Restore DPoP key pair from the private JWK stored in the cookie
    const { privateKey, publicJwk } = restoreDpopKeyPair(
      dpopPrivateJwk as import("node:crypto").JsonWebKey,
    );

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
      const errorBody = await tokenResponse
        .text()
        .catch(() => tokenResponse.statusText);
      console.error(
        "[oauth/epds/callback] Token exchange failed:",
        tokenResponse.status,
        errorBody,
      );
      return NextResponse.redirect(
        new URL("/?error=auth_failed", config.baseUrl),
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

    // 10a. Validate sub is a DID
    if (
      !tokenData.sub ||
      !(
        tokenData.sub.startsWith("did:plc:") ||
        tokenData.sub.startsWith("did:web:")
      )
    ) {
      console.error(
        "[oauth/epds/callback] Invalid sub in token response:",
        tokenData.sub,
      );
      return NextResponse.redirect(
        new URL("/?error=auth_failed", config.baseUrl),
      );
    }

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
        scope: (tokenData.scope ??
          OAUTH_SCOPE) as NodeSavedSession["tokenSet"]["scope"],
        access_token: tokenData.access_token,
        token_type: "DPoP" as const,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : undefined,
      },
    };

    // TODO: RedisSessionStore.set() does not support TTL — sessions persist until manually deleted
    // The SDK handles token refresh internally, so stale sessions get refreshed or error out
    await sessionStore.set(tokenData.sub, nodeSavedSession);

    // 12. Create redirect response to /
    const response = NextResponse.redirect(new URL("/", config.baseUrl));

    // 13. Set user-did cookie (session cookie — no maxAge, expires when browser closes)
    // Avoids stale cookie outliving the backend session (Redis/refresh token)
    response.cookies.set("user-did", tokenData.sub, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[oauth/epds/callback] Unexpected error:", error);
    return NextResponse.redirect(
      new URL("/?error=auth_failed", config.baseUrl),
    );
  }
}
