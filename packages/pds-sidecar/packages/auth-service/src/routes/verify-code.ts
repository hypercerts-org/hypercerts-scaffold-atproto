import { Router } from 'express';
import type { OTPService, RateLimiter, CallbackSigner } from '@certified/shared';
import { RATE_LIMITS } from '@certified/shared';
import type { Account } from '@certified/shared';
import type Database from 'better-sqlite3';
import { getSession } from '../session.js';
import { renderOTPPage, maskEmail } from '../templates.js';

export function createVerifyCodeRouter(opts: {
  otpService: OTPService;
  rateLimiter: RateLimiter;
  callbackSigner: CallbackSigner;
  db: Database.Database;
  sessionSecret: string;
  pdsUrl: string;
}): Router {
  const router = Router();
  const { otpService, rateLimiter, callbackSigner, db, sessionSecret, pdsUrl } = opts;

  router.post('/auth/verify-code', async (req, res) => {
    const { code } = req.body as { code?: string };

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Code is required' });
      return;
    }

    // Get client IP
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    // Check rate limits: per-IP verify
    const ipResult = await rateLimiter.checkLimit(
      ip,
      RATE_LIMITS.VERIFY_PER_IP.action,
      RATE_LIMITS.VERIFY_PER_IP.maxCount,
      RATE_LIMITS.VERIFY_PER_IP.windowMinutes
    );
    if (!ipResult.allowed) {
      res.setHeader('Retry-After', ipResult.retryAfterSeconds ?? 900);
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfterSeconds: ipResult.retryAfterSeconds,
      });
      return;
    }

    // Retrieve email from session
    const session = getSession(req, sessionSecret);
    if (!session?.email) {
      res.status(400).json({ error: 'Session expired. Please start over.' });
      return;
    }

    const { email, requestUri, clientId } = session;
    const csrfToken = (req.cookies?.['csrf-token'] as string) || '';

    // Verify OTP
    const result = await otpService.verifyOTP(email, code);

    if (!result.valid) {
      // Re-render OTP page with error
      const html = renderOTPPage({
        maskedEmail: maskEmail(email),
        csrfToken,
        error: result.error,
      });

      const acceptsJson =
        req.headers['content-type']?.includes('application/json') ||
        req.headers['accept']?.includes('application/json');

      if (acceptsJson) {
        res.json({ success: false, error: result.error, html });
      } else {
        res.status(400).send(html);
      }
      return;
    }

    // OTP valid — check if account exists
    const existingAccount = db
      .prepare('SELECT * FROM accounts WHERE email = ?')
      .get(email) as Account | undefined;

    const newAccount = !existingAccount;

    // Build HMAC-signed callback URL
    const timestamp = Math.floor(Date.now() / 1000);
    const callbackUrl = callbackSigner.buildCallbackUrl(pdsUrl, {
      requestUri,
      email,
      approved: true,
      newAccount,
      timestamp,
    });

    // Redirect to PDS callback
    const acceptsJson =
      req.headers['content-type']?.includes('application/json') ||
      req.headers['accept']?.includes('application/json');

    if (acceptsJson) {
      res.json({ success: true, redirect: callbackUrl });
    } else {
      res.redirect(callbackUrl);
    }
  });

  return router;
}
