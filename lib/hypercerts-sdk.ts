import { createATProtoSDK } from "@hypercerts-org/sdk-core";
import { config, OAUTH_SCOPE } from "./config";
import { RedisSessionStore, RedisStateStore } from "./redis-state-store";

export const sessionStore = new RedisSessionStore();
export const stateStore = new RedisStateStore();

export { OAUTH_SCOPE };

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
  handleResolver: config.pdsUrl,
  logger: console,
});

export default sdk;
