import type { JsonWebKey } from "node:crypto";
import { NodeOAuthClient, JoseKey } from "@atproto/oauth-client-node";
import type {
  NodeSavedSessionStore as SessionStore,
  NodeSavedStateStore as StateStore,
} from "@atproto/oauth-client-node";

import { buildClientMetadata, config } from "@/lib/config";

interface EpdsOAuthState {
  codeVerifier: string;
  dpopPrivateJwk: JsonWebKey;
}

interface SessionIdStore {
  set(sessionId: string, did: string): Promise<void>;
  get(sessionId: string): Promise<string | undefined>;
  del(sessionId: string): Promise<void>;
}

interface EpdsStateStore {
  set(state: string, data: EpdsOAuthState): Promise<void>;
  get(state: string): Promise<EpdsOAuthState | undefined>;
  del(state: string): Promise<void>;
}

interface OAuthStores {
  sessionStore: SessionStore;
  sessionIdStore: SessionIdStore;
  stateStore: StateStore;
  epdsStateStore: EpdsStateStore;
}

async function loadOAuthStores(): Promise<OAuthStores> {
  if (config.sessionStore === "memory") {
    const {
      MemorySessionStore,
      MemorySessionIdStore,
      MemoryStateStore,
      MemoryEpdsStateStore,
    } = await import("@/lib/memory-state-store");

    return {
      sessionStore: new MemorySessionStore(),
      sessionIdStore: new MemorySessionIdStore(),
      stateStore: new MemoryStateStore(),
      epdsStateStore: new MemoryEpdsStateStore(),
    };
  }

  const {
    RedisSessionStore,
    RedisSessionIdStore,
    RedisStateStore,
    RedisEpdsStateStore,
  } = await import("@/lib/redis-state-store");

  return {
    sessionStore: new RedisSessionStore(),
    sessionIdStore: new RedisSessionIdStore(),
    stateStore: new RedisStateStore(),
    epdsStateStore: new RedisEpdsStateStore(),
  };
}

const stores = await loadOAuthStores();

export const sessionStore = stores.sessionStore;
export const sessionIdStore = stores.sessionIdStore;
const stateStore = stores.stateStore;
export const epdsStateStore = stores.epdsStateStore;

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
