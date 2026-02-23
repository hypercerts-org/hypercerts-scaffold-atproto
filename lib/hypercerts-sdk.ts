import { createATProtoSDK } from "@hypercerts-org/sdk-core";
import { config, OAUTH_SCOPE } from "./config";
import { RedisSessionStore, RedisStateStore } from "./redis-state-store";

export const sessionStore = new RedisSessionStore();
export const stateStore = new RedisStateStore();

export { OAUTH_SCOPE };

// Future granular scopes (not yet used)
export const HYPERCERT_REPO_SCOPE =
  "repo?collection=org.hypercerts.claim.activity&collection=org.hypercerts.claim.contribution&collection=org.hypercerts.claim.evaluation&collection=org.hypercerts.claim.evidence&collection=org.hypercerts.claim.measurement&collection=org.hypercerts.claim.collection&collection=org.hypercerts.claim.rights&collection=org.hypercerts.claim.funding&collection=app.certified.location&action=create&action=update&action=delete";

export const RPC_SCOPE = [
  "rpc:app.bsky.actor.getProfile?aud=did:web:api.bsky.app%23bsky_appview",
].join(" ");

export const BLOB_SCOPE = "blob?accept=video/*&accept=image/*";

// OAuth configuration using centralized config
const oauthConfig = {
  clientId: config.clientId,
  redirectUri: config.redirectUri,
  scope: config.scope,
  jwksUri: config.jwksUri,
  jwkPrivate: config.jwkPrivate,
  developmentMode: config.isDevelopment,
};

// Create ATProto SDK instance
const sdk = createATProtoSDK({
  oauth: oauthConfig,
  storage: {
    sessionStore,
    stateStore,
  },
  handleResolver: config.handleResolver,
  logger: console,
});

export default sdk;
