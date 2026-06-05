import "server-only";

import type { JsonWebKey } from "node:crypto";
import type {
  NodeSavedSession,
  NodeSavedSessionStore as SessionStore,
  NodeSavedState,
  NodeSavedStateStore as StateStore,
} from "@atproto/oauth-client-node";

const STATE_EXPIRATION_SECONDS = 600; // 10 minutes for temporary OAuth state
const SESSION_EXPIRATION_SECONDS = 86400; // 24 hours for user sessions
const MEMORY_STORE_GLOBAL_KEY = "__hypercertsScaffoldOAuthMemoryStores";

interface EpdsOAuthState {
  codeVerifier: string;
  dpopPrivateJwk: JsonWebKey;
}

interface ExpiringEntry {
  value: string;
  expiresAt: number;
}

interface MemoryStoreBuckets {
  oauthStates: Map<string, ExpiringEntry>;
  sessions: Map<string, ExpiringEntry>;
  sessionIds: Map<string, ExpiringEntry>;
  epdsOAuthStates: Map<string, ExpiringEntry>;
}

interface GlobalWithMemoryStores {
  [MEMORY_STORE_GLOBAL_KEY]?: MemoryStoreBuckets;
}

function createMemoryStoreBuckets(): MemoryStoreBuckets {
  return {
    oauthStates: new Map<string, ExpiringEntry>(),
    sessions: new Map<string, ExpiringEntry>(),
    sessionIds: new Map<string, ExpiringEntry>(),
    epdsOAuthStates: new Map<string, ExpiringEntry>(),
  };
}

function getMemoryStoreBuckets(): MemoryStoreBuckets {
  const globalStore = globalThis as typeof globalThis & GlobalWithMemoryStores;
  const existingBuckets = globalStore[MEMORY_STORE_GLOBAL_KEY];

  if (existingBuckets) {
    return existingBuckets;
  }

  const newBuckets = createMemoryStoreBuckets();
  globalStore[MEMORY_STORE_GLOBAL_KEY] = newBuckets;
  return newBuckets;
}

class ExpiringMemoryStore<T> {
  constructor(
    private readonly entries: Map<string, ExpiringEntry>,
    private readonly ttlSeconds: number,
  ) {}

  set(key: string, value: T): void {
    this.pruneExpiredEntries();
    this.entries.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    return JSON.parse(entry.value) as T;
  }

  getDel(key: string): T | undefined {
    const value = this.get(key);
    this.entries.delete(key);
    return value;
  }

  del(key: string): void {
    this.entries.delete(key);
  }

  private pruneExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) {
        this.entries.delete(key);
      }
    }
  }
}

const memoryStoreBuckets = getMemoryStoreBuckets();
const oauthStateStore = new ExpiringMemoryStore<NodeSavedState>(
  memoryStoreBuckets.oauthStates,
  STATE_EXPIRATION_SECONDS,
);
const sessionMemoryStore = new ExpiringMemoryStore<NodeSavedSession>(
  memoryStoreBuckets.sessions,
  SESSION_EXPIRATION_SECONDS,
);
const sessionIdMemoryStore = new ExpiringMemoryStore<string>(
  memoryStoreBuckets.sessionIds,
  SESSION_EXPIRATION_SECONDS,
);
const epdsOAuthStateStore = new ExpiringMemoryStore<EpdsOAuthState>(
  memoryStoreBuckets.epdsOAuthStates,
  STATE_EXPIRATION_SECONDS,
);

/**
 * Process-local OAuth state store for local development without Redis.
 *
 * OAuth state entries expire after 10 minutes and are kept on `globalThis` so
 * Next.js development hot reloads do not immediately lose in-flight login
 * attempts. Use this only for single-process local development because entries
 * disappear when the server process restarts and are not shared across hosts.
 */
export class MemoryStateStore implements StateStore {
  async set(state: string, data: NodeSavedState): Promise<void> {
    oauthStateStore.set(state, data);
  }

  async get(state: string): Promise<NodeSavedState | undefined> {
    return oauthStateStore.get(state);
  }

  async del(state: string): Promise<void> {
    oauthStateStore.del(state);
  }
}

/**
 * Process-local OAuth session store for local development without Redis.
 *
 * Saved ATProto OAuth sessions expire after 24 hours. The store mimics Redis
 * serialization by writing JSON strings internally, which prevents callers from
 * relying on object identity or mutating stored values by reference.
 */
export class MemorySessionStore implements SessionStore {
  async set(did: string, session: NodeSavedSession): Promise<void> {
    sessionMemoryStore.set(did, session);
  }

  async get(did: string): Promise<NodeSavedSession | undefined> {
    return sessionMemoryStore.get(did);
  }

  async del(did: string): Promise<void> {
    sessionMemoryStore.del(did);
  }
}

/**
 * Process-local opaque session id mapping for local development without Redis.
 *
 * Maps the `sid` cookie value to the authenticated user DID for 24 hours. This
 * is intentionally not durable and should never be used for Vercel preview,
 * production, or any multi-instance deployment.
 */
export class MemorySessionIdStore {
  async set(sessionId: string, did: string): Promise<void> {
    sessionIdMemoryStore.set(sessionId, did);
  }

  async get(sessionId: string): Promise<string | undefined> {
    return sessionIdMemoryStore.get(sessionId);
  }

  async del(sessionId: string): Promise<void> {
    sessionIdMemoryStore.del(sessionId);
  }
}

/**
 * Process-local ePDS OAuth state store for local development without Redis.
 *
 * ePDS state contains the PKCE verifier and DPoP private key needed by the
 * callback route. Reads are destructive to match Redis `GETDEL` behavior and
 * prevent replaying the same state value.
 */
export class MemoryEpdsStateStore {
  async set(state: string, data: EpdsOAuthState): Promise<void> {
    epdsOAuthStateStore.set(state, data);
  }

  async get(state: string): Promise<EpdsOAuthState | undefined> {
    return epdsOAuthStateStore.getDel(state);
  }

  async del(state: string): Promise<void> {
    epdsOAuthStateStore.del(state);
  }
}
