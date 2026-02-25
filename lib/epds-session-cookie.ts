/**
 * ePDS OAuth Session Cookie
 *
 * Encodes/decodes a signed, encrypted HttpOnly cookie that stores transient
 * OAuth state during the ePDS login flow. The cookie lives for 10 minutes
 * (matching PAR request_uri lifetime) and is deleted after the callback.
 *
 * Format: base64url(iv+ciphertext+authTag).base64url(hmac-sha256)
 * The payload is AES-256-GCM encrypted before base64url encoding.
 * The outer HMAC provides a second integrity layer.
 */

import {
  createHmac,
  timingSafeEqual,
  hkdfSync,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import { config } from "@/lib/config";

export const EPDS_SESSION_COOKIE_NAME = "epds-oauth-session";

export interface EpdsOAuthSessionData {
  state: string;
  codeVerifier: string;
  dpopPrivateJwk: JsonWebKey; // from node:crypto
}

/**
 * Get the OAUTH_SESSION_SECRET from centralized config.
 * Throws if not set.
 */
function getSessionSecret(): string {
  const secret = config.oauthSessionSecret;
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
 * Derive a 32-byte AES-256 encryption key from the session secret using HKDF.
 */
function deriveEncryptionKey(secret: string): Buffer {
  return Buffer.from(
    hkdfSync("sha256", secret, "", "epds-session-cookie-enc", 32),
  );
}

/**
 * Compute HMAC-SHA256 of the given data using the session secret.
 */
function computeHmac(data: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

/**
 * Encode an EpdsOAuthSessionData into a signed, encrypted cookie value.
 *
 * Format: `${base64url(iv+ciphertext+authTag)}.${base64url(hmac)}`
 * The JSON payload is AES-256-GCM encrypted before base64url encoding.
 * The outer HMAC provides a second integrity layer.
 */
export function encodeEpdsSessionCookie(data: EpdsOAuthSessionData): string {
  const secret = getSessionSecret();
  const encKey = deriveEncryptionKey(secret);

  // Serialize and encrypt the JSON payload
  const json = JSON.stringify(data);
  const iv = randomBytes(12); // 12-byte IV for AES-256-GCM
  const cipher = createCipheriv("aes-256-gcm", encKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(json, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16-byte GCM auth tag

  // Concatenate: iv (12) + ciphertext + authTag (16)
  const encrypted = Buffer.concat([iv, ciphertext, authTag]);
  const payload = toBase64Url(encrypted);

  // Outer HMAC for second integrity layer
  const hmac = computeHmac(payload, secret);
  const signature = toBase64Url(hmac);
  return `${payload}.${signature}`;
}

/**
 * Decode and verify a signed, encrypted cookie value produced by encodeEpdsSessionCookie.
 *
 * Throws 'Invalid session cookie' if the HMAC doesn't match, decryption fails,
 * or parsing fails.
 */
export function decodeEpdsSessionCookie(cookie: string): EpdsOAuthSessionData {
  const secret = getSessionSecret();

  const dotIndex = cookie.indexOf(".");
  if (dotIndex === -1) {
    throw new Error("Invalid session cookie");
  }

  const payload = cookie.slice(0, dotIndex);
  const signature = cookie.slice(dotIndex + 1);

  // Recompute expected HMAC (outer integrity check first)
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

  // Decrypt the payload
  try {
    const encKey = deriveEncryptionKey(secret);
    const encrypted = Buffer.from(payload, "base64url");

    // Extract iv (12 bytes), authTag (last 16 bytes), ciphertext (middle)
    if (encrypted.length < 12 + 16) {
      throw new Error("Invalid session cookie");
    }
    const iv = encrypted.subarray(0, 12);
    const authTag = encrypted.subarray(encrypted.length - 16);
    const ciphertext = encrypted.subarray(12, encrypted.length - 16);

    const decipher = createDecipheriv("aes-256-gcm", encKey, iv);
    decipher.setAuthTag(authTag);
    const json =
      decipher.update(ciphertext, undefined, "utf8") + decipher.final("utf8");
    return JSON.parse(json) as EpdsOAuthSessionData;
  } catch {
    throw new Error("Invalid session cookie");
  }
}
