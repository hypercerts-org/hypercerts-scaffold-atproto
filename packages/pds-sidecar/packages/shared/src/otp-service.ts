import crypto from 'crypto';
import type Database from 'better-sqlite3';
import type { OTPToken } from './types.js';

export class OTPService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  async generateOTP(email: string): Promise<{ code: string; expiresAt: Date }> {
    const code = crypto.randomInt(10000000, 99999999).toString();
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Mark any existing unused tokens for this email as used
    this.db
      .prepare(`UPDATE otp_tokens SET used = 1 WHERE email = ? AND used = 0`)
      .run(email);

    // Insert new token
    this.db
      .prepare(
        `INSERT INTO otp_tokens (email, token_hash, attempts, max_attempts, expires_at, used)
         VALUES (?, ?, 0, 5, ?, 0)`
      )
      .run(email, tokenHash, expiresAt.toISOString());

    return { code, expiresAt };
  }

  async verifyOTP(
    email: string,
    code: string
  ): Promise<{ valid: boolean; error?: string }> {
    const providedHash = crypto.createHash('sha256').update(code).digest('hex');

    // Find the most recent unused, non-expired token for this email
    const token = this.db
      .prepare(
        `SELECT * FROM otp_tokens
         WHERE email = ? AND used = 0 AND expires_at > datetime('now')
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .get(email) as OTPToken | undefined;

    if (!token) {
      return { valid: false, error: 'No valid code found. Please request a new one.' };
    }

    // Increment attempts
    const newAttempts = token.attempts + 1;
    this.db
      .prepare(`UPDATE otp_tokens SET attempts = ? WHERE id = ?`)
      .run(newAttempts, token.id);

    // Check max attempts
    if (newAttempts >= token.max_attempts) {
      this.db
        .prepare(`UPDATE otp_tokens SET used = 1 WHERE id = ?`)
        .run(token.id);
      return { valid: false, error: 'Too many attempts. Please request a new code.' };
    }

    // Timing-safe comparison
    const storedHashBuf = Buffer.from(token.token_hash, 'hex');
    const providedHashBuf = Buffer.from(providedHash, 'hex');

    const isMatch = crypto.timingSafeEqual(storedHashBuf, providedHashBuf);

    if (isMatch) {
      this.db
        .prepare(`UPDATE otp_tokens SET used = 1 WHERE id = ?`)
        .run(token.id);
      return { valid: true };
    }

    return { valid: false, error: 'Invalid code. Please try again.' };
  }

  async cleanupExpired(): Promise<number> {
    const result = this.db
      .prepare(
        `DELETE FROM otp_tokens WHERE expires_at < datetime('now') OR used = 1`
      )
      .run();
    return result.changes;
  }
}
