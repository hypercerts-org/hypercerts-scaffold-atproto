import { Router } from 'express';
import type { OTPService, Mailer, RateLimiter } from '@certified/shared';
import { RATE_LIMITS } from '@certified/shared';
import { getSession, setSession } from '../session.js';
import { renderOTPPage, maskEmail } from '../templates.js';

export function createSendCodeRouter(opts: {
  otpService: OTPService;
  mailer: Mailer;
  rateLimiter: RateLimiter;
  sessionSecret: string;
}): Router {
  const router = Router();
  const { otpService, mailer, rateLimiter, sessionSecret } = opts;

  router.post('/auth/send-code', async (req, res) => {
    const { email: rawEmail } = req.body as { email?: string };

    if (!rawEmail || typeof rawEmail !== 'string') {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const email = rawEmail.toLowerCase().trim();

    if (!email.includes('@')) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    // Get client IP
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    // Check rate limits: per-email burst
    const emailBurstResult = await rateLimiter.checkLimit(
      email,
      RATE_LIMITS.OTP_PER_EMAIL_BURST.action,
      RATE_LIMITS.OTP_PER_EMAIL_BURST.maxCount,
      RATE_LIMITS.OTP_PER_EMAIL_BURST.windowMinutes
    );
    if (!emailBurstResult.allowed) {
      res.setHeader('Retry-After', emailBurstResult.retryAfterSeconds ?? 900);
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfterSeconds: emailBurstResult.retryAfterSeconds,
      });
      return;
    }

    // Check rate limits: per-email hourly
    const emailHourlyResult = await rateLimiter.checkLimit(
      email,
      RATE_LIMITS.OTP_PER_EMAIL.action,
      RATE_LIMITS.OTP_PER_EMAIL.maxCount,
      RATE_LIMITS.OTP_PER_EMAIL.windowMinutes
    );
    if (!emailHourlyResult.allowed) {
      res.setHeader('Retry-After', emailHourlyResult.retryAfterSeconds ?? 3600);
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfterSeconds: emailHourlyResult.retryAfterSeconds,
      });
      return;
    }

    // Check rate limits: per-IP
    const ipResult = await rateLimiter.checkLimit(
      ip,
      RATE_LIMITS.OTP_PER_IP.action,
      RATE_LIMITS.OTP_PER_IP.maxCount,
      RATE_LIMITS.OTP_PER_IP.windowMinutes
    );
    if (!ipResult.allowed) {
      res.setHeader('Retry-After', ipResult.retryAfterSeconds ?? 900);
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfterSeconds: ipResult.retryAfterSeconds,
      });
      return;
    }

    // Generate OTP and send email (anti-enumeration: always succeed)
    try {
      const { code } = await otpService.generateOTP(email);
      await mailer.sendOTP(email, code);
    } catch (err) {
      // Log but don't expose — anti-enumeration
      console.error('Failed to send OTP:', err);
    }

    // Update session with email
    const existingSession = getSession(req, sessionSecret);
    const session = {
      requestUri: existingSession?.requestUri ?? '',
      clientId: existingSession?.clientId ?? '',
      email,
    };
    setSession(res, session, sessionSecret);

    // Respond: if fetch (JSON), return redirect info; otherwise redirect
    const acceptsJson =
      req.headers['content-type']?.includes('application/json') ||
      req.headers['accept']?.includes('application/json');

    if (acceptsJson) {
      res.json({ success: true, redirect: '/auth/verify' });
    } else {
      res.redirect('/auth/verify');
    }
  });

  // POST /auth/resend-code — re-send OTP using email stored in session cookie
  router.post('/auth/resend-code', async (req, res) => {
    const session = getSession(req, sessionSecret);

    if (!session?.email) {
      res.status(400).json({ error: 'Session expired. Please start over.' });
      return;
    }

    const email = session.email;

    // Get client IP
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    // Check rate limits: per-email burst
    const emailBurstResult = await rateLimiter.checkLimit(
      email,
      RATE_LIMITS.OTP_PER_EMAIL_BURST.action,
      RATE_LIMITS.OTP_PER_EMAIL_BURST.maxCount,
      RATE_LIMITS.OTP_PER_EMAIL_BURST.windowMinutes
    );
    if (!emailBurstResult.allowed) {
      res.setHeader('Retry-After', emailBurstResult.retryAfterSeconds ?? 900);
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfterSeconds: emailBurstResult.retryAfterSeconds,
      });
      return;
    }

    // Check rate limits: per-email hourly
    const emailHourlyResult = await rateLimiter.checkLimit(
      email,
      RATE_LIMITS.OTP_PER_EMAIL.action,
      RATE_LIMITS.OTP_PER_EMAIL.maxCount,
      RATE_LIMITS.OTP_PER_EMAIL.windowMinutes
    );
    if (!emailHourlyResult.allowed) {
      res.setHeader('Retry-After', emailHourlyResult.retryAfterSeconds ?? 3600);
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfterSeconds: emailHourlyResult.retryAfterSeconds,
      });
      return;
    }

    // Check rate limits: per-IP
    const ipResult = await rateLimiter.checkLimit(
      ip,
      RATE_LIMITS.OTP_PER_IP.action,
      RATE_LIMITS.OTP_PER_IP.maxCount,
      RATE_LIMITS.OTP_PER_IP.windowMinutes
    );
    if (!ipResult.allowed) {
      res.setHeader('Retry-After', ipResult.retryAfterSeconds ?? 900);
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfterSeconds: ipResult.retryAfterSeconds,
      });
      return;
    }

    // Re-generate OTP and send email (anti-enumeration: always succeed)
    try {
      const { code } = await otpService.generateOTP(email);
      await mailer.sendOTP(email, code);
    } catch (err) {
      // Log but don't expose — anti-enumeration
      console.error('Failed to resend OTP:', err);
    }

    res.json({ success: true, message: 'Code resent!' });
  });

  // GET /auth/verify — render OTP page (for redirect after send-code)
  router.get('/auth/verify', (req, res) => {
    const session = getSession(req, sessionSecret);
    const csrfToken = (req.cookies?.['csrf-token'] as string) || '';

    if (!session?.email) {
      res.redirect('/');
      return;
    }

    res.send(renderOTPPage({ maskedEmail: maskEmail(session.email), csrfToken }));
  });

  return router;
}
