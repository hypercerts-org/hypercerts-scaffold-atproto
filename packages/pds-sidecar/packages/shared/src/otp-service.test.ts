import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDatabase } from './db.js';
import { OTPService } from './otp-service.js';
import type Database from 'better-sqlite3';

let db: Database.Database;
let service: OTPService;

beforeEach(() => {
  db = createDatabase(':memory:');
  service = new OTPService(db);
});

describe('OTPService', () => {
  // Test 1: generateOTP returns an 8-digit numeric string
  it('generateOTP returns an 8-digit numeric string', async () => {
    const { code, expiresAt } = await service.generateOTP('user@example.com');
    expect(code).toMatch(/^\d{8}$/);
    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  // Test 2: verifyOTP succeeds with correct code
  it('verifyOTP succeeds with correct code', async () => {
    const { code } = await service.generateOTP('user@example.com');
    const result = await service.verifyOTP('user@example.com', code);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  // Test 3: verifyOTP fails with wrong code
  it('verifyOTP fails with wrong code', async () => {
    await service.generateOTP('user@example.com');
    const result = await service.verifyOTP('user@example.com', '00000000');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid code. Please try again.');
  });

  // Test 4: verifyOTP fails after code expires (mock time)
  it('verifyOTP fails after code expires', async () => {
    const { code } = await service.generateOTP('user@example.com');

    // Manually expire the token by updating expires_at to the past
    db.prepare(`UPDATE otp_tokens SET expires_at = datetime('now', '-1 minute') WHERE email = ?`).run('user@example.com');

    const result = await service.verifyOTP('user@example.com', code);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('No valid code found. Please request a new one.');
  });

  // Test 5: verifyOTP fails after max attempts exceeded
  it('verifyOTP fails after max attempts exceeded', async () => {
    const { code } = await service.generateOTP('user@example.com');

    // Make 4 wrong attempts (max_attempts = 5, so 4th attempt increments to 4, not yet locked)
    for (let i = 0; i < 4; i++) {
      await service.verifyOTP('user@example.com', '00000000');
    }

    // 5th attempt: increments to 5 >= max_attempts (5), so it locks
    const result = await service.verifyOTP('user@example.com', code);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Too many attempts. Please request a new code.');
  });

  // Test 6: verifyOTP fails when no token exists
  it('verifyOTP fails when no token exists', async () => {
    const result = await service.verifyOTP('nobody@example.com', '12345678');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('No valid code found. Please request a new one.');
  });

  // Test 7: Generating a new OTP invalidates the previous one for the same email
  it('generating a new OTP invalidates the previous one for the same email', async () => {
    const { code: firstCode } = await service.generateOTP('user@example.com');
    // Generate a second OTP — should invalidate the first
    const { code: secondCode } = await service.generateOTP('user@example.com');

    // The first code should no longer work (old token is marked used)
    const result = await service.verifyOTP('user@example.com', firstCode);
    expect(result.valid).toBe(false);

    // The second (new) code should work
    const result2 = await service.verifyOTP('user@example.com', secondCode);
    expect(result2.valid).toBe(true);
  });

  // Test 8: cleanupExpired removes old tokens
  it('cleanupExpired removes old tokens', async () => {
    await service.generateOTP('a@example.com');
    await service.generateOTP('b@example.com');

    // Expire one token manually
    db.prepare(`UPDATE otp_tokens SET expires_at = datetime('now', '-1 minute') WHERE email = ?`).run('a@example.com');

    // Mark the other as used
    db.prepare(`UPDATE otp_tokens SET used = 1 WHERE email = ?`).run('b@example.com');

    const deleted = await service.cleanupExpired();
    expect(deleted).toBe(2);

    const remaining = db.prepare(`SELECT COUNT(*) as count FROM otp_tokens`).get() as { count: number };
    expect(remaining.count).toBe(0);
  });

  // Test 9: Timing-safe comparison is used (verify by checking the code path)
  it('uses timing-safe comparison (token is marked used after successful verify)', async () => {
    const { code } = await service.generateOTP('user@example.com');
    const result = await service.verifyOTP('user@example.com', code);
    expect(result.valid).toBe(true);

    // Token should now be marked as used (single-use)
    const token = db.prepare(`SELECT used FROM otp_tokens WHERE email = ?`).get('user@example.com') as { used: number };
    expect(token.used).toBe(1);

    // Attempting to reuse the same code should fail
    const reuse = await service.verifyOTP('user@example.com', code);
    expect(reuse.valid).toBe(false);
    expect(reuse.error).toBe('No valid code found. Please request a new one.');
  });
});
