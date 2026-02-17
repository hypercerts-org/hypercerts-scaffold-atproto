import { Router } from 'express';
import type { OTPService, Mailer } from '@certified/shared';
import { setSession } from '../session.js';
import { renderEmailInputPage, renderOTPPage, maskEmail } from '../templates.js';

export function createAuthorizeRouter(opts: {
  otpService: OTPService;
  mailer: Mailer;
  sessionSecret: string;
}): Router {
  const router = Router();
  const { otpService, mailer, sessionSecret } = opts;

  router.get('/oauth/authorize', async (req, res) => {
    const { request_uri, client_id, login_hint } = req.query as Record<string, string | undefined>;

    if (!request_uri) {
      res.status(400).send('Missing required parameter: request_uri');
      return;
    }

    const csrfToken = (req.cookies?.['csrf-token'] as string) || '';

    // Store OAuth flow state in session cookie
    const session = {
      requestUri: request_uri,
      clientId: client_id ?? '',
      email: undefined as string | undefined,
    };

    // If login_hint looks like an email, auto-send OTP
    if (login_hint && login_hint.includes('@')) {
      const email = login_hint.toLowerCase().trim();
      session.email = email;
      setSession(res, session, sessionSecret);

      // Auto-trigger OTP send
      try {
        const { code } = await otpService.generateOTP(email);
        await mailer.sendOTP(email, code);
      } catch (err) {
        // Log but don't fail — anti-enumeration: always show OTP page
        console.error('Failed to send OTP for login_hint:', err);
      }

      // Render OTP verification page directly
      res.send(renderOTPPage({ maskedEmail: maskEmail(email), csrfToken }));
      return;
    }

    // No login_hint — render email input page
    setSession(res, session, sessionSecret);
    res.send(renderEmailInputPage({ csrfToken }));
  });

  return router;
}
