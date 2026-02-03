import { ATPROTO_SCOPE, createATProtoSDK, TRANSITION_SCOPES } from "@hypercerts-org/sdk-core";
import { RedisSessionStore, RedisStateStore } from "./redis-state-store";

if (
  !process.env.ATPROTO_JWK_PRIVATE ||
  !process.env.NEXT_PUBLIC_APP_URL ||
  !process.env.NEXT_PUBLIC_PDS_URL ||
  !process.env.NEXT_PUBLIC_SDS_URL
) {
  throw new Error("Some environment vars missing");
}

export const sessionStore = new RedisSessionStore();
export const stateStore = new RedisStateStore();

export const HYPERCERT_REPO_SCOPE =
  "repo?collection=org.hypercerts.claim.activity&collection=org.hypercerts.claim.contribution&collection=org.hypercerts.claim.evaluation&collection=org.hypercerts.claim.evidence&collection=org.hypercerts.claim.measurement&collection=org.hypercerts.claim.collection&collection=org.hypercerts.claim.rights&collection=org.hypercerts.claim.funding&collection=app.certified.location&action=create&action=update&action=delete";

export const RPC_SCOPE = [
  "rpc:app.bsky.actor.getProfile?aud=did:web:api.bsky.app%23bsky_appview",
].join(" ");

export const BLOB_SCOPE = "blob?accept=video/*&accept=image/*"

// export const OAUTH_SCOPE = [ATPROTO_SCOPE, RPC_SCOPE, HYPERCERT_REPO_SCOPE, BLOB_SCOPE].join(" ");

// for now we use trnastion:generic. but slowly move towards scopes listed above.
export const OAUTH_SCOPE = [ATPROTO_SCOPE, TRANSITION_SCOPES.GENERIC].join(" ")


const sdk = createATProtoSDK({
  oauth: {
    clientId: `${process.env.NEXT_PUBLIC_APP_URL}/client-metadata.json`,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    scope: OAUTH_SCOPE,
    jwksUri: `${process.env.NEXT_PUBLIC_APP_URL}/jwks.json`,
    jwkPrivate: process.env.ATPROTO_JWK_PRIVATE,
  },
  storage: {
    sessionStore,
    stateStore,
  },
  servers: {
    pds: process.env.NEXT_PUBLIC_PDS_URL,
    sds: process.env.NEXT_PUBLIC_SDS_URL,
  },
  logger: console,
});

export default sdk;
