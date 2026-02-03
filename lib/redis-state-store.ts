import { SessionStore, StateStore } from "@hypercerts-org/sdk-core";
import { ensureRedis, redisClient } from "./redis";
import { NodeSavedSession, NodeSavedState } from "@atproto/oauth-client-node";

const STATE_PREFIX = "oauth-state:";
const SESSION_PREFIX = "session:";
const STATE_EXPIRATION_SECONDS = 600; // 10 minutes for temporary OAuth state

export class RedisStateStore implements StateStore {

  async set(state: string, data: NodeSavedState): Promise<void> {
    await ensureRedis();
    const key = `${STATE_PREFIX}${state}`;
    await redisClient.set(key, JSON.stringify(data), {
      EX: STATE_EXPIRATION_SECONDS,
    });
  }

  async get(state: string): Promise<NodeSavedState | undefined> {
    await ensureRedis();
    const key = `${STATE_PREFIX}${state}`;
    const data = await redisClient.get(key);
    return data ? (JSON.parse(data) as NodeSavedState) : undefined;
  }

  async del(state: string): Promise<void> {
    await ensureRedis();
    const key = `${STATE_PREFIX}${state}`;
    await redisClient.del(key);
  }
}

export class RedisSessionStore implements SessionStore {

  async set(did: string, session: NodeSavedSession): Promise<void> {
    await ensureRedis();
    const key = `${SESSION_PREFIX}${did}`;
    await redisClient.set(key, JSON.stringify(session));
  }

  async get(did: string): Promise<NodeSavedSession | undefined> {
    await ensureRedis();
    const key = `${SESSION_PREFIX}${did}`;
    const data = await redisClient.get(key);
    return data ? (JSON.parse(data) as NodeSavedSession) : undefined;
  }

  async del(did: string): Promise<void> {
    await ensureRedis();
    const key = `${SESSION_PREFIX}${did}`;
    await redisClient.del(key);
  }
}
