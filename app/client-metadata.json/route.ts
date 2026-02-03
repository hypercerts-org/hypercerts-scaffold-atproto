import { HYPERCERT_REPO_SCOPE, OAUTH_SCOPE } from "@/lib/hypercerts-sdk";
import { ATPROTO_SCOPE } from "@hypercerts-org/sdk-core";
import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { error: "Missing PUBLIC_BASE_URL or NGROK_URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    client_id: `${baseUrl}/client-metadata.json`,
    client_name: "Hypercert Scaffold",
    client_uri: baseUrl,
    redirect_uris: [`${baseUrl}/api/auth/callback`],
    scope: OAUTH_SCOPE,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    application_type: "web",
    dpop_bound_access_tokens: true,
  });
}
