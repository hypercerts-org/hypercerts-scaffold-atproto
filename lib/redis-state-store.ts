import type {
  NodeSavedSessionStore as SessionStore,
  NodeSavedStateStore as StateStore,
} from "@atproto/oauth-client-node";
import { redisClient } from "@/lib/redis";
import { NodeSavedSession, NodeSavedState } from "@atproto/oauth-client-node";

const STATE_PREFIX = "oauth-state:";
const SESSION_PREFIX = "session:";
const STATE_EXPIRATION_SECONDS = 600; // 10 minutes for temporary OAuth state
const SESSION_EXPIRATION_SECONDS = 86400; // 24 hours for user sessions
const EPDS_STATE_PREFIX = "epds-oauth-state:";

export interface EpdsOAuthState {
  codeVerifier: string;
  dpopPrivateJwk: JsonWebKey;
}

/**
 * Redis-backed OAuth state store
 * Redis connection is established automatically on module load
 */
export class RedisStateStore implements StateStore {
  async set(state: string, data: NodeSavedState): Promise<void> {
    const key = `${STATE_PREFIX}${state}`;
    await redisClient.set(key, JSON.stringify(data), {
      EX: STATE_EXPIRATION_SECONDS,
    });
  }

  async get(state: string): Promise<NodeSavedState | undefined> {
    const key = `${STATE_PREFIX}${state}`;
    const data = await redisClient.get(key);
    return data ? (JSON.parse(data) as NodeSavedState) : undefined;
  }

  async del(state: string): Promise<void> {
    const key = `${STATE_PREFIX}${state}`;
    await redisClient.del(key);
  }
}

/**
 * Redis-backed session store
 * Redis connection is established automatically on module load
 */
export class RedisSessionStore implements SessionStore {
  async set(did: string, session: NodeSavedSession): Promise<void> {
    const key = `${SESSION_PREFIX}${did}`;
    await redisClient.set(key, JSON.stringify(session), {
      EX: SESSION_EXPIRATION_SECONDS,
    });
  }

  async get(did: string): Promise<NodeSavedSession | undefined> {
    const key = `${SESSION_PREFIX}${did}`;
    const data = await redisClient.get(key);
    return data ? (JSON.parse(data) as NodeSavedSession) : undefined;
  }

  async del(did: string): Promise<void> {
    const key = `${SESSION_PREFIX}${did}`;
    await redisClient.del(key);
  }
}

/**
 * Redis-backed ePDS OAuth state store
 * Stores ephemeral OAuth state (codeVerifier + dpopPrivateJwk) for ePDS login flows
 */
export class RedisEpdsStateStore {
  async set(state: string, data: EpdsOAuthState): Promise<void> {
    const key = `${EPDS_STATE_PREFIX}${state}`;
    await redisClient.set(key, JSON.stringify(data), {
      EX: STATE_EXPIRATION_SECONDS,
    });
  }

  async get(state: string): Promise<EpdsOAuthState | undefined> {
    const key = `${EPDS_STATE_PREFIX}${state}`;
    const data = await redisClient.getDel(key);
    return data ? (JSON.parse(data) as EpdsOAuthState) : undefined;
  }

  async del(state: string): Promise<void> {
    const key = `${EPDS_STATE_PREFIX}${state}`;
    await redisClient.del(key);
  }
}
