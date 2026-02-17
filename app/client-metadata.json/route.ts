import { config, OAUTH_SCOPE } from "@/lib/config";
import { NextResponse } from "next/server";

/**
 * OAuth Client Metadata Endpoint
 *
 * Returns OAuth client metadata according to RFC 7591
 * Automatically configured based on environment (loopback vs production)
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7591
 */
export async function GET() {
  return NextResponse.json({
    client_id: config.clientId,
    client_name: "Hypercert Scaffold",
    client_uri: config.baseUrl,
    redirect_uris: [config.redirectUri],
    scope: OAUTH_SCOPE,
    logo_uri: `${config.baseUrl}/favicon.ico`,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    application_type: config.isLoopback ? "native" : "web",
    dpop_bound_access_tokens: true,
  });
}
