import { ATProtoSDKConfig, createATProtoSDK } from "@hypercerts-org/sdk-core";
import { buildClientMetadata, config, OAUTH_SCOPE } from "./config";
import {
  RedisSessionStore,
  RedisStateStore,
  RedisEpdsStateStore,
} from "./redis-state-store";

export const sessionStore = new RedisSessionStore();
export const stateStore = new RedisStateStore();
export const epdsStateStore = new RedisEpdsStateStore();

export { OAUTH_SCOPE };

const clientMetadata = buildClientMetadata();

const oauthConfig = {
  clientId: clientMetadata.client_id,
  redirectUri: clientMetadata.redirect_uris[0],
  scope: clientMetadata.scope,
  jwksUri: clientMetadata.jwks_uri,
  jwkPrivate: config.jwkPrivate,
  developmentMode: config.isDevelopment,
} as ATProtoSDKConfig["oauth"];

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
