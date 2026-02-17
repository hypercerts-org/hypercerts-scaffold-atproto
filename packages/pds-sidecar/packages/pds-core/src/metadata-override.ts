// metadata-override.ts
// Intercepts GET /.well-known/oauth-authorization-server and rewrites
// `authorization_endpoint` to point to the sidecar auth service.
//
// The @atproto/oauth-provider may serve this endpoint using chunked transfer
// encoding (via res.write() + res.end()) or as a single buffer (via res.end()).
// The response may also be compressed (gzip/brotli/deflate).
// We intercept both res.write() and res.end() to collect all chunks, decompress
// if needed, modify the JSON, and re-send the response uncompressed.
//
// IMPORTANT: This middleware must be injected BEFORE the PDS route handlers
// in the Express stack. See index.ts for how this is done.

import type { RequestHandler } from 'express';
import { gunzipSync, brotliDecompressSync, inflateSync } from 'zlib';

/**
 * Decompresses a buffer based on the Content-Encoding header.
 */
function decompress(buf: Buffer, encoding: string | undefined): Buffer {
  if (!encoding) return buf;
  const enc = encoding.toLowerCase().trim();
  if (enc === 'gzip' || enc === 'x-gzip') {
    return gunzipSync(buf);
  }
  if (enc === 'br') {
    return brotliDecompressSync(buf);
  }
  if (enc === 'deflate') {
    return inflateSync(buf);
  }
  return buf;
}

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

    // Disable compression for this endpoint so we can modify the response body.
    // The PDS's compression middleware would otherwise re-compress our modified
    // response and re-add Content-Encoding: gzip, causing decompression errors.
    delete req.headers['accept-encoding'];

    // Collect all chunks written to the response
    const chunks: Buffer[] = [];
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);

    // Intercept res.write() to collect chunks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).write = function (
      chunk: unknown,
      encodingOrCallback?: unknown,
      callback?: unknown,
    ): boolean {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        const enc =
          typeof encodingOrCallback === 'string'
            ? (encodingOrCallback as BufferEncoding)
            : 'utf8';
        chunks.push(Buffer.from(chunk, enc));
      }
      // Don't write yet — we'll write everything in res.end()
      // Return true to indicate the write was accepted
      if (typeof encodingOrCallback === 'function') {
        (encodingOrCallback as () => void)();
      } else if (typeof callback === 'function') {
        (callback as () => void)();
      }
      return true;
    };

    // Intercept res.end() to modify and send the complete response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).end = function (
      chunk?: unknown,
      encodingOrCallback?: unknown,
      callback?: unknown,
    ): void {
      // Add final chunk if provided
      if (chunk && Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else if (chunk && typeof chunk === 'string') {
        const enc =
          typeof encodingOrCallback === 'string'
            ? (encodingOrCallback as BufferEncoding)
            : 'utf8';
        chunks.push(Buffer.from(chunk, enc));
      }

      // Combine all chunks
      const compressedBody = Buffer.concat(chunks);

      let finalBody = compressedBody;
      try {
        if (compressedBody.length > 0) {
          // Decompress if needed
          const contentEncoding = res.getHeader('content-encoding') as string | undefined;
          const rawBody = decompress(compressedBody, contentEncoding);
          const jsonStr = rawBody.toString('utf8');
          const metadata = JSON.parse(jsonStr) as Record<string, unknown>;
          metadata['authorization_endpoint'] = authorizationEndpoint;
          finalBody = Buffer.from(JSON.stringify(metadata), 'utf8');
          // Remove content-encoding header since we're sending uncompressed
          res.removeHeader('content-encoding');
          // Update content-length
          res.setHeader('content-length', finalBody.length);
        }
      } catch {
        // If parsing fails, pass through unmodified
      }

      // Restore original methods and send the modified response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (res as any).write = origWrite;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (res as any).end = origEnd;

      const cb =
        typeof encodingOrCallback === 'function'
          ? (encodingOrCallback as () => void)
          : typeof callback === 'function'
            ? (callback as () => void)
            : undefined;

      origEnd(finalBody, cb as (() => void) | undefined);
    };

    next();
  };
}
