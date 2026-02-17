import type Database from 'better-sqlite3';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export const RATE_LIMITS = {
  OTP_PER_EMAIL: { action: 'otp_send', maxCount: 5, windowMinutes: 60 },
  OTP_PER_EMAIL_BURST: { action: 'otp_send', maxCount: 3, windowMinutes: 15 },
  OTP_PER_IP: { action: 'otp_send_ip', maxCount: 10, windowMinutes: 15 },
  VERIFY_PER_IP: { action: 'otp_verify_ip', maxCount: 20, windowMinutes: 15 },
} as const;

export class RateLimiter {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  async checkLimit(
    key: string,
    action: string,
    maxCount: number,
    windowMinutes: number
  ): Promise<RateLimitResult> {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    const windowStartStr = windowStart.toISOString();

    const row = this.db
      .prepare(
        `SELECT SUM(count) as total FROM rate_limits WHERE key = ? AND action = ? AND window_start > ?`
      )
      .get(key, action, windowStartStr) as { total: number | null };

    const total = row?.total ?? 0;

    if (total >= maxCount) {
      // Find the oldest entry in the window to calculate retry-after
      const oldest = this.db
        .prepare(
          `SELECT window_start FROM rate_limits WHERE key = ? AND action = ? AND window_start > ? ORDER BY window_start ASC LIMIT 1`
        )
        .get(key, action, windowStartStr) as { window_start: string } | undefined;

      let retryAfterSeconds = windowMinutes * 60;
      if (oldest) {
        const oldestTime = new Date(oldest.window_start).getTime();
        const expiresAt = oldestTime + windowMinutes * 60 * 1000;
        retryAfterSeconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      }

      return { allowed: false, retryAfterSeconds };
    }

    // Insert or update the rate limit entry for the current minute window
    await this.recordAction(key, action);

    return { allowed: true };
  }

  async recordAction(key: string, action: string): Promise<void> {
    // Use the current minute as the window_start (truncate to minute)
    const now = new Date();
    const windowStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      0,
      0
    ).toISOString();

    // Try to update existing entry for this key/action/window_start
    const result = this.db
      .prepare(
        `UPDATE rate_limits SET count = count + 1 WHERE key = ? AND action = ? AND window_start = ?`
      )
      .run(key, action, windowStart);

    if (result.changes === 0) {
      // No existing entry for this minute window — insert a new one
      this.db
        .prepare(
          `INSERT INTO rate_limits (key, action, count, window_start) VALUES (?, ?, 1, ?)`
        )
        .run(key, action, windowStart);
    }
  }

  async cleanupOld(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const result = this.db
      .prepare(`DELETE FROM rate_limits WHERE window_start < ?`)
      .run(oneHourAgo);
    return result.changes;
  }
}

// Generic request/response interfaces so Express is not required as a dependency
export interface GenericRequest {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}

export interface GenericResponse {
  status(code: number): GenericResponse;
  setHeader(name: string, value: string | number): void;
  json(body: unknown): void;
}

export type NextFunction = () => void;

export type RequestHandler<
  Req extends GenericRequest = GenericRequest,
  Res extends GenericResponse = GenericResponse,
> = (req: Req, res: Res, next: NextFunction) => void | Promise<void>;

export function rateLimitMiddleware<
  Req extends GenericRequest = GenericRequest,
  Res extends GenericResponse = GenericResponse,
>(
  rateLimiter: RateLimiter,
  keyExtractor: (req: Req) => string,
  config: { action: string; maxCount: number; windowMinutes: number }
): RequestHandler<Req, Res> {
  return async (req: Req, res: Res, next: NextFunction) => {
    const key = keyExtractor(req);
    const result = await rateLimiter.checkLimit(
      key,
      config.action,
      config.maxCount,
      config.windowMinutes
    );

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfterSeconds ?? config.windowMinutes * 60);
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfterSeconds: result.retryAfterSeconds,
      });
      return;
    }

    next();
  };
}
