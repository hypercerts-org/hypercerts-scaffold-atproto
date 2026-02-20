import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Automatically redirects requests from localhost to 127.0.0.1
 * to ensure RFC 8252 compliance for OAuth loopback clients.
 *
 * RFC 8252 Section 7.3 requires loopback OAuth clients to use
 * IP addresses (127.0.0.1) instead of hostnames (localhost) to
 * prevent DNS rebinding attacks and ensure proper OAuth flow.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc8252#section-7.3
 */
export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";

  if (hostname.startsWith("localhost:")) {
    const newHost = hostname.replace("localhost", "127.0.0.1");

    const redirectUrl = new URL(request.url);
    redirectUrl.hostname = "127.0.0.1";
    redirectUrl.port = newHost.split(":")[1] || "3000";
    return NextResponse.redirect(redirectUrl, {
      status: 307,
    });
  }

  return NextResponse.next();
}

/**
 * Proxy configuration
 * Runs on all routes to ensure consistent redirect behavior
 */
export const config = {
  matcher: "/:path*",
};
