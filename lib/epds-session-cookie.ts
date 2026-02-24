/**
 * ePDS OAuth Session Cookie
 *
 * Encodes/decodes a signed HttpOnly cookie that stores transient OAuth state
 * during the ePDS login flow. The cookie lives for 10 minutes (matching PAR
 * request_uri lifetime) and is deleted after the callback.
 *
 * Format: base64url(json).base64url(hmac-sha256)
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const EPDS_SESSION_COOKIE_NAME = "epds-oauth-session";

export interface EpdsOAuthSessionData {
  state: string;
  codeVerifier: string;
  dpopPrivateJwk: JsonWebKey; // from node:crypto
}

/**
 * Get the OAUTH_SESSION_SECRET from environment variables.
 * Throws if not set.
 */
function getSessionSecret(): string {
  const secret = process.env.OAUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "OAUTH_SESSION_SECRET is not configured. " +
        "Please set this environment variable to a random secret string.",
    );
  }
  return secret;
}

/**
 * Encode a Buffer or string to base64url (no padding, URL-safe)
 */
function toBase64Url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

/**
 * Compute HMAC-SHA256 of the given data using the session secret.
 */
function computeHmac(data: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

/**
 * Encode an EpdsOAuthSessionData into a signed cookie value.
 *
 * Format: `${base64url(json)}.${base64url(hmac)}`
 */
export function encodeEpdsSessionCookie(data: EpdsOAuthSessionData): string {
  const secret = getSessionSecret();
  const json = JSON.stringify(data);
  const payload = toBase64Url(json);
  const hmac = computeHmac(payload, secret);
  const signature = toBase64Url(hmac);
  return `${payload}.${signature}`;
}

/**
 * Decode and verify a signed cookie value produced by encodeEpdsSessionCookie.
 *
 * Throws 'Invalid session cookie' if the HMAC doesn't match or parsing fails.
 */
export function decodeEpdsSessionCookie(cookie: string): EpdsOAuthSessionData {
  const secret = getSessionSecret();

  const dotIndex = cookie.indexOf(".");
  if (dotIndex === -1) {
    throw new Error("Invalid session cookie");
  }

  const payload = cookie.slice(0, dotIndex);
  const signature = cookie.slice(dotIndex + 1);

  // Recompute expected HMAC
  const expectedHmac = computeHmac(payload, secret);
  const expectedSignature = toBase64Url(expectedHmac);

  // Constant-time comparison to prevent timing attacks
  let signatureMatches: boolean;
  try {
    const sigBuf = Buffer.from(signature, "base64url");
    const expectedBuf = Buffer.from(expectedSignature, "base64url");
    signatureMatches =
      sigBuf.length === expectedBuf.length &&
      timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    throw new Error("Invalid session cookie");
  }

  if (!signatureMatches) {
    throw new Error("Invalid session cookie");
  }

  // Decode and parse the payload
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json) as EpdsOAuthSessionData;
  } catch {
    throw new Error("Invalid session cookie");
  }
}
