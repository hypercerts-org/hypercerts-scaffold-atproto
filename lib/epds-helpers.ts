/**
 * ePDS OAuth helpers — PKCE + DPoP utilities
 *
 * All crypto operations use node:crypto only — no external JWT libraries.
 * Based on the ePDS integration tutorial:
 * https://github.com/hypercerts-org/ePDS/blob/main/docs/tutorial.md
 */

import * as crypto from "node:crypto";

// ─── PKCE ────────────────────────────────────────────────────────────────────

/**
 * Generate a PKCE code verifier (random 32-byte base64url string).
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Generate a PKCE code challenge (SHA-256 hash of verifier, base64url).
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Generate a random OAuth state value (16-byte base64url string).
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString("base64url");
}

// ─── DPoP ────────────────────────────────────────────────────────────────────

/**
 * Generate a fresh EC P-256 DPoP key pair for a single OAuth flow.
 * Never reuse the same key pair across flows.
 */
export function generateDpopKeyPair(): {
  privateKey: crypto.KeyObject;
  publicJwk: crypto.JsonWebKey;
  privateJwk: crypto.JsonWebKey;
} {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });
  return {
    privateKey,
    publicJwk: publicKey.export({ format: "jwk" }),
    privateJwk: privateKey.export({ format: "jwk" }),
  };
}

/**
 * Restore a DPoP key pair from a serialized private JWK (e.g. from a session cookie).
 */
export function restoreDpopKeyPair(privateJwk: crypto.JsonWebKey): {
  privateKey: crypto.KeyObject;
  publicJwk: crypto.JsonWebKey;
} {
  const privateKey = crypto.createPrivateKey({ key: privateJwk, format: "jwk" });
  const publicKey = crypto.createPublicKey(privateKey);
  return { privateKey, publicJwk: publicKey.export({ format: "jwk" }) };
}

/**
 * Convert a DER-encoded ECDSA signature to raw r||s format (64 bytes).
 * Required for ES256 JWTs — not exported.
 */
function derToRaw(der: Buffer): Buffer {
  let offset = 2;
  if (der[1]! > 0x80) offset += der[1]! - 0x80;
  offset++; // skip 0x02
  const rLen = der[offset++]!;
  let r = der.subarray(offset, offset + rLen);
  offset += rLen;
  offset++; // skip 0x02
  const sLen = der[offset++]!;
  let s = der.subarray(offset, offset + sLen);
  if (r.length > 32) r = r.subarray(r.length - 32);
  if (s.length > 32) s = s.subarray(s.length - 32);
  const raw = Buffer.alloc(64);
  r.copy(raw, 32 - r.length);
  s.copy(raw, 64 - s.length);
  return raw;
}

/**
 * Create a DPoP proof JWT (ES256, typ: dpop+jwt).
 *
 * @param opts.privateKey  - EC P-256 private key
 * @param opts.jwk         - Public JWK to embed in the header
 * @param opts.method      - HTTP method (e.g. "POST")
 * @param opts.url         - Full URL of the request
 * @param opts.nonce       - Optional server-provided nonce
 * @param opts.accessToken - Optional access token (adds `ath` claim)
 */
export function createDpopProof(opts: {
  privateKey: crypto.KeyObject;
  jwk: object;
  method: string;
  url: string;
  nonce?: string;
  accessToken?: string;
}): string {
  const header = { alg: "ES256", typ: "dpop+jwt", jwk: opts.jwk };
  const payload: Record<string, unknown> = {
    jti: crypto.randomUUID(),
    htm: opts.method,
    htu: opts.url,
    iat: Math.floor(Date.now() / 1000),
  };
  if (opts.nonce) payload.nonce = opts.nonce;
  if (opts.accessToken) {
    payload.ath = crypto
      .createHash("sha256")
      .update(opts.accessToken)
      .digest("base64url");
  }

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingInput = `${headerB64}.${payloadB64}`;
  const sig = crypto.sign("sha256", Buffer.from(signingInput), opts.privateKey);
  return `${signingInput}.${derToRaw(sig).toString("base64url")}`;
}

// ─── Nonce-retry helper ───────────────────────────────────────────────────────

/**
 * POST `url` with `body`, adding a DPoP proof header.
 *
 * ePDS always rejects the first request with a 400 + `dpop-nonce` header.
 * This helper handles that retry automatically so callers don't have to.
 */
export async function fetchWithDpopRetry(
  url: string,
  body: URLSearchParams,
  privateKey: crypto.KeyObject,
  publicJwk: object,
): Promise<Response> {
  let dpopProof = createDpopProof({
    privateKey,
    jwk: publicJwk,
    method: "POST",
    url,
  });

  let res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      DPoP: dpopProof,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const dpopNonce = res.headers.get("dpop-nonce");
    if (dpopNonce && (res.status === 400 || res.status === 401)) {
      dpopProof = createDpopProof({
        privateKey,
        jwk: publicJwk,
        method: "POST",
        url,
        nonce: dpopNonce,
      });
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          DPoP: dpopProof,
        },
        body: body.toString(),
      });
    }
  }

  return res;
}
