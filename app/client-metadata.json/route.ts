import { buildClientMetadata } from "@/lib/config";
import { NextResponse } from "next/server";

/**
 * OAuth Client Metadata Endpoint
 *
 * Returns OAuth client metadata according to RFC 7591.
 * In production mode, includes custom branding CSS for PDS OAuth pages.
 * In loopback mode, returns minimal metadata (PDS ignores it anyway).
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7591
 */
export async function GET() {
  return NextResponse.json(buildClientMetadata());
}
