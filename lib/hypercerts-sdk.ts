import { NodeOAuthClient, JoseKey } from "@atproto/oauth-client-node";
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

const oauthClient = new NodeOAuthClient({
  clientMetadata,
  stateStore,
  sessionStore,
  handleResolver: config.handleResolver,
  // keyset is needed for non-loopback (production) clients that use private_key_jwt
  // For loopback, token_endpoint_auth_method is 'none' so keyset is optional
  ...(config.jwkPrivate
    ? {
        keyset: await Promise.all(
          (
            JSON.parse(config.jwkPrivate).keys ?? [
              JSON.parse(config.jwkPrivate),
            ]
          ).map((jwk: Record<string, unknown>) => JoseKey.fromJWK(jwk)),
        ),
      }
    : {}),
});

export default oauthClient;
