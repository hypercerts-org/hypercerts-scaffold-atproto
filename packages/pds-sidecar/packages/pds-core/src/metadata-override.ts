// metadata-override.ts
// Intercepts GET /.well-known/oauth-authorization-server and rewrites
// `authorization_endpoint` to point to the sidecar auth service.
//
// The @atproto/oauth-provider serves this endpoint using staticJsonMiddleware
// which pre-serializes the JSON to a buffer and sends it via res.end() directly
// (NOT via res.json() or res.send()). So we intercept res.end() to modify
// the raw JSON body before it's sent.
//
// IMPORTANT: This middleware must be injected BEFORE the PDS route handlers
// in the Express stack. See index.ts for how this is done.

import type { RequestHandler } from 'express';

/**
 * Creates an Express middleware that intercepts the OAuth authorization server
 * metadata endpoint and replaces `authorization_endpoint` with the sidecar URL.
 *
 * @param authServiceUrl - The base URL of the sidecar auth service
 *   (e.g. `https://auth.pds.certs.network`)
 */
export function createMetadataOverride(authServiceUrl: string): RequestHandler {
  const authorizationEndpoint = `${authServiceUrl}/oauth/authorize`;

  return function metadataOverride(req, res, next) {
    // Only intercept the OAuth AS metadata endpoint
    if (req.path !== '/.well-known/oauth-authorization-server') {
      return next();
    }

    // The PDS uses staticJsonMiddleware which calls res.end() with a Buffer.
    // We intercept res.end() to modify the JSON body before it's sent.
    // The original response does NOT include a content-length header, so we
    // don't need to update it — Node.js computes it from the buffer size.
    const origEnd = res.end;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).end = function (...args: unknown[]) {
      const chunk = args[0];

      try {
        // chunk may be a Buffer or string containing JSON
        let jsonStr: string | null = null;
        if (Buffer.isBuffer(chunk)) {
          jsonStr = chunk.toString('utf8');
        } else if (typeof chunk === 'string') {
          jsonStr = chunk;
        }

        if (jsonStr) {
          const metadata = JSON.parse(jsonStr) as Record<string, unknown>;
          metadata['authorization_endpoint'] = authorizationEndpoint;
          const modified = Buffer.from(JSON.stringify(metadata), 'utf8');
          // Replace the chunk with the modified buffer
          args[0] = modified;
        }
      } catch {
        // If parsing fails, pass through unmodified
      }

      // Call original end with (possibly modified) args, preserving `this` context
      return origEnd.apply(this, args as Parameters<typeof origEnd>);
    };

    next();
  };
}
