import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    // Generate a new CSRF token and set it as a cookie
    const token = crypto.randomBytes(32).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // JS needs to read it for double-submit pattern
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 600 * 1000, // 10 minutes
    });
    next();
    return;
  }

  // POST/PUT/DELETE: validate CSRF token
  const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken) {
    res.status(403).json({ error: 'CSRF token missing' });
    return;
  }

  // Timing-safe comparison
  try {
    const cookieBuf = Buffer.from(cookieToken, 'utf8');
    const headerBuf = Buffer.from(headerToken, 'utf8');

    if (cookieBuf.length !== headerBuf.length) {
      res.status(403).json({ error: 'CSRF token invalid' });
      return;
    }

    const match = crypto.timingSafeEqual(cookieBuf, headerBuf);
    if (!match) {
      res.status(403).json({ error: 'CSRF token invalid' });
      return;
    }
  } catch {
    res.status(403).json({ error: 'CSRF token invalid' });
    return;
  }

  next();
}
