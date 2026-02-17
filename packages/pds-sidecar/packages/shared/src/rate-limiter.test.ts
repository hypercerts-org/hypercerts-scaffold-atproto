import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { RateLimiter, rateLimitMiddleware, RATE_LIMITS } from './rate-limiter.js';
import type { GenericRequest, GenericResponse } from './rate-limiter.js';

function createInMemoryDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id INTEGER PRIMARY KEY,
      key TEXT NOT NULL,
      action TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      window_start TEXT NOT NULL
    )
  `);
  return db;
}

describe('RateLimiter', () => {
  let db: Database.Database;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    db = createInMemoryDb();
    rateLimiter = new RateLimiter(db);
  });

  it('allows requests under the limit', async () => {
    const result1 = await rateLimiter.checkLimit('user@example.com', 'otp_send', 5, 60);
    expect(result1.allowed).toBe(true);

    const result2 = await rateLimiter.checkLimit('user@example.com', 'otp_send', 5, 60);
    expect(result2.allowed).toBe(true);

    const result3 = await rateLimiter.checkLimit('user@example.com', 'otp_send', 5, 60);
    expect(result3.allowed).toBe(true);
  });

  it('blocks requests over the limit', async () => {
    // Use up all 3 allowed requests
    for (let i = 0; i < 3; i++) {
      const result = await rateLimiter.checkLimit('user@example.com', 'otp_send', 3, 60);
      expect(result.allowed).toBe(true);
    }

    // The 4th request should be blocked
    const blocked = await rateLimiter.checkLimit('user@example.com', 'otp_send', 3, 60);
    expect(blocked.allowed).toBe(false);
  });

  it('returns correct retryAfterSeconds', async () => {
    // Use up all 2 allowed requests
    for (let i = 0; i < 2; i++) {
      await rateLimiter.checkLimit('user@example.com', 'otp_send', 2, 15);
    }

    const blocked = await rateLimiter.checkLimit('user@example.com', 'otp_send', 2, 15);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeDefined();
    expect(typeof blocked.retryAfterSeconds).toBe('number');
    // Should be at most 15 minutes (900 seconds)
    expect(blocked.retryAfterSeconds!).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds!).toBeLessThanOrEqual(15 * 60);
  });

  it('tracks different keys independently', async () => {
    // Use up all 2 allowed requests for user1
    for (let i = 0; i < 2; i++) {
      await rateLimiter.checkLimit('user1@example.com', 'otp_send', 2, 60);
    }

    // user1 should be blocked
    const blockedUser1 = await rateLimiter.checkLimit('user1@example.com', 'otp_send', 2, 60);
    expect(blockedUser1.allowed).toBe(false);

    // user2 should still be allowed
    const allowedUser2 = await rateLimiter.checkLimit('user2@example.com', 'otp_send', 2, 60);
    expect(allowedUser2.allowed).toBe(true);
  });

  it('tracks different actions independently', async () => {
    // Use up all 2 allowed requests for action 'otp_send'
    for (let i = 0; i < 2; i++) {
      await rateLimiter.checkLimit('user@example.com', 'otp_send', 2, 60);
    }

    // 'otp_send' should be blocked
    const blockedSend = await rateLimiter.checkLimit('user@example.com', 'otp_send', 2, 60);
    expect(blockedSend.allowed).toBe(false);

    // 'otp_verify' should still be allowed
    const allowedVerify = await rateLimiter.checkLimit('user@example.com', 'otp_verify', 2, 60);
    expect(allowedVerify.allowed).toBe(true);
  });

  it('cleanup removes old entries', async () => {
    // Insert some old entries directly into the DB (older than 1 hour)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    db.prepare(
      `INSERT INTO rate_limits (key, action, count, window_start) VALUES (?, ?, ?, ?)`
    ).run('old-key', 'otp_send', 5, twoHoursAgo);

    // Also insert a recent entry
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    db.prepare(
      `INSERT INTO rate_limits (key, action, count, window_start) VALUES (?, ?, ?, ?)`
    ).run('new-key', 'otp_send', 2, fiveMinutesAgo);

    const deleted = await rateLimiter.cleanupOld();
    expect(deleted).toBe(1); // Only the old entry should be deleted

    // Verify the recent entry is still there
    const remaining = db
      .prepare(`SELECT COUNT(*) as count FROM rate_limits`)
      .get() as { count: number };
    expect(remaining.count).toBe(1);
  });

  it('allows requests after the window expires', async () => {
    // Insert entries with a window_start that is outside the current window
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    db.prepare(
      `INSERT INTO rate_limits (key, action, count, window_start) VALUES (?, ?, ?, ?)`
    ).run('user@example.com', 'otp_send', 10, twoHoursAgo);

    // Should be allowed since the old entries are outside the 60-minute window
    const result = await rateLimiter.checkLimit('user@example.com', 'otp_send', 5, 60);
    expect(result.allowed).toBe(true);
  });
});

describe('rateLimitMiddleware', () => {
  let db: Database.Database;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    db = createInMemoryDb();
    rateLimiter = new RateLimiter(db);
  });

  it('returns 429 when rate limited', async () => {
    // Use up all allowed requests
    for (let i = 0; i < 2; i++) {
      await rateLimiter.checkLimit('192.168.1.1', 'otp_send_ip', 2, 15);
    }

    const middleware = rateLimitMiddleware(
      rateLimiter,
      (req: GenericRequest) => req.ip ?? '127.0.0.1',
      { action: 'otp_send_ip', maxCount: 2, windowMinutes: 15 }
    );

    const req: GenericRequest = {
      headers: {},
      ip: '192.168.1.1',
    };

    let statusCode = 0;
    let responseBody: unknown = null;
    let retryAfterHeader: string | number | undefined;
    let nextCalled = false;

    const res: GenericResponse = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      setHeader(name: string, value: string | number) {
        if (name === 'Retry-After') {
          retryAfterHeader = value;
        }
      },
      json(body: unknown) {
        responseBody = body;
      },
    };

    const next = () => {
      nextCalled = true;
    };

    await middleware(req, res, next);

    expect(statusCode).toBe(429);
    expect(nextCalled).toBe(false);
    expect(retryAfterHeader).toBeDefined();
    expect(responseBody).toMatchObject({ error: 'Too Many Requests' });
  });

  it('calls next() when under the limit', async () => {
    const middleware = rateLimitMiddleware(
      rateLimiter,
      (req: GenericRequest) => req.ip ?? '127.0.0.1',
      RATE_LIMITS.OTP_PER_IP
    );

    const req: GenericRequest = {
      headers: {},
      ip: '10.0.0.1',
    };

    let statusCode = 0;
    let nextCalled = false;

    const res: GenericResponse = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      setHeader() {},
      json() {},
    };

    const next = () => {
      nextCalled = true;
    };

    await middleware(req, res, next);

    expect(nextCalled).toBe(true);
    expect(statusCode).toBe(0); // status was never called
  });
});

describe('RATE_LIMITS constants', () => {
  it('has correct OTP_PER_EMAIL config', () => {
    expect(RATE_LIMITS.OTP_PER_EMAIL.action).toBe('otp_send');
    expect(RATE_LIMITS.OTP_PER_EMAIL.maxCount).toBe(5);
    expect(RATE_LIMITS.OTP_PER_EMAIL.windowMinutes).toBe(60);
  });

  it('has correct OTP_PER_EMAIL_BURST config', () => {
    expect(RATE_LIMITS.OTP_PER_EMAIL_BURST.action).toBe('otp_send');
    expect(RATE_LIMITS.OTP_PER_EMAIL_BURST.maxCount).toBe(3);
    expect(RATE_LIMITS.OTP_PER_EMAIL_BURST.windowMinutes).toBe(15);
  });

  it('has correct OTP_PER_IP config', () => {
    expect(RATE_LIMITS.OTP_PER_IP.action).toBe('otp_send_ip');
    expect(RATE_LIMITS.OTP_PER_IP.maxCount).toBe(10);
    expect(RATE_LIMITS.OTP_PER_IP.windowMinutes).toBe(15);
  });

  it('has correct VERIFY_PER_IP config', () => {
    expect(RATE_LIMITS.VERIFY_PER_IP.action).toBe('otp_verify_ip');
    expect(RATE_LIMITS.VERIFY_PER_IP.maxCount).toBe(20);
    expect(RATE_LIMITS.VERIFY_PER_IP.windowMinutes).toBe(15);
  });
});
