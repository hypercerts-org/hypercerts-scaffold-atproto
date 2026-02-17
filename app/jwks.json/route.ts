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

  // Transform private keys to public keys for OAuth verification:
  // - Remove private component ("d")
  // - Remove any "use" or "key_ops" from private key
  // - Add key_ops: ["verify"] for OAuth server validation
  const PRIVATE_KEY_FIELDS = ["d", "use", "key_ops"] as const;
  const keys = (privateKey.keys as Array<{ [key: string]: unknown }>).map(
    (jwkWithPrivate) => {
      // Remove private key components before exposing the public key
      const publicJwk = Object.fromEntries(
        Object.entries(jwkWithPrivate).filter(
          ([k]) =>
            !PRIVATE_KEY_FIELDS.includes(
              k as (typeof PRIVATE_KEY_FIELDS)[number],
            ),
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
