import { NextResponse } from "next/server";

/**
 * JSON Web Key Set (JWKS) endpoint.
 *
 * This endpoint serves the public keys used for OAuth token endpoint
 * authentication. ATProto authorization servers fetch this to verify
 * the signatures on our client assertion JWTs.
 *
 * Only the public key components are exposed - the private key is
 * kept secret in the ATPROTO_JWK_PRIVATE environment variable.
 *
 */
export async function GET() {
  const rawJwk = process.env.ATPROTO_JWK_PRIVATE;
  if (!rawJwk) {
    return NextResponse.json(
      { error: "ATPROTO_JWK_PRIVATE environment variable is not configured." },
      { status: 500 },
    );
  }

  let privateKey;
  try {
    privateKey = JSON.parse(rawJwk);
  } catch {
    return NextResponse.json(
      { error: "ATPROTO_JWK_PRIVATE contains invalid JSON." },
      { status: 500 },
    );
  }

  if (
    !privateKey.keys ||
    !Array.isArray(privateKey.keys) ||
    privateKey.keys.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "ATPROTO_JWK_PRIVATE must contain a JWKS with a non-empty 'keys' array.",
      },
      { status: 500 },
    );
  }

  // Transform private keys to public keys for OAuth verification using an
  // allowlist of known public JWK fields. This is safer than a denylist because
  // any future private fields (e.g. RSA: p, q, dp, dq, qi, oth) are excluded
  // by default rather than requiring explicit removal.
  const PUBLIC_JWK_FIELDS = [
    "kty",
    "crv",
    "x",
    "y", // EC public fields
    "n",
    "e", // RSA public fields
    "kid",
    "alg", // Metadata
  ] as const;
  const keys = (privateKey.keys as Array<{ [key: string]: unknown }>).map(
    (jwkWithPrivate) => {
      // Only include known public fields — private components are excluded by default
      const publicJwk = Object.fromEntries(
        Object.entries(jwkWithPrivate).filter(([k]) =>
          PUBLIC_JWK_FIELDS.includes(k as (typeof PUBLIC_JWK_FIELDS)[number]),
        ),
      );
      return {
        ...publicJwk,
        key_ops: ["verify"], // OAuth servers expect this for signature verification
      };
    },
  );

  return NextResponse.json(
    { keys },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
