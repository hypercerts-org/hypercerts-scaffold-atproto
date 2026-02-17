// metadata-override.ts
// Intercepts GET /.well-known/oauth-authorization-server and rewrites
// `authorization_endpoint` to point to the sidecar auth service.
//
// This middleware must be mounted BEFORE the PDS middleware in the Express
// stack so it can intercept and modify the response.

import type { RequestHandler, Response } from 'express';

/**
 * Creates an Express middleware that intercepts the OAuth authorization server
 * metadata endpoint and replaces `authorization_endpoint` with the sidecar URL.
 *
 * @param authServiceUrl - The base URL of the sidecar auth service
 *   (e.g. `https://auth.pds.certs.network`)
 */
export function createMetadataOverride(authServiceUrl: string): RequestHandler {
  return function metadataOverride(req, res, next) {
    // Only intercept the OAuth AS metadata endpoint
    if (req.path !== '/.well-known/oauth-authorization-server') {
      return next();
    }

    // Override res.json to capture and modify the response body before sending
    const originalJson = res.json.bind(res) as Response['json'];

    res.json = function (body: unknown) {
      // Restore original json to avoid infinite recursion
      res.json = originalJson;

      if (body && typeof body === 'object' && !Array.isArray(body)) {
        const metadata = body as Record<string, unknown>;
        // Replace authorization_endpoint with the sidecar's authorize endpoint.
        // All other OAuth endpoints (PAR, token, JWKS) remain on the PDS.
        metadata['authorization_endpoint'] = `${authServiceUrl}/oauth/authorize`;
      }

      return originalJson(body);
    } as Response['json'];

    next();
  };
}
