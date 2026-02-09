import { HYPERCERT_REPO_SCOPE, OAUTH_SCOPE } from "@/lib/hypercerts-sdk";
import { ATPROTO_SCOPE } from "@hypercerts-org/sdk-core";
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_APP_URL;
  const redirectBaseUrl = process.env.NEXT_PUBLIC_REDIRECT_BASE_URL;

  if (!clientId || !redirectBaseUrl) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_REDIRECT_BASE_URL" },
      { status: 500 },
    );
  }

  // Detect if this is a loopback configuration
  const isLoopback = clientId.startsWith('http://localhost');

  return NextResponse.json({
    // For loopback: client_id is http://localhost (no /client-metadata.json)
    // For production: client_id includes /client-metadata.json
    client_id: isLoopback ? clientId : `${clientId}/client-metadata.json`,
    client_name: "Hypercert Scaffold",
    client_uri: redirectBaseUrl,
    // Redirect URIs must use IP address (127.0.0.1) for loopback per RFC 8252
    redirect_uris: [`${redirectBaseUrl}/api/auth/callback`],
    scope: OAUTH_SCOPE,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    // Loopback clients are "native" type, web clients are "web"
    application_type: isLoopback ? "native" : "web",
    dpop_bound_access_tokens: true,
  });
}
