import crypto from 'crypto';
import type { Request, Response } from 'express';

export interface AuthFlowSession {
  requestUri: string;
  clientId: string;
  email?: string;
}

const SESSION_COOKIE = 'auth-session';
const SESSION_MAX_AGE = 600; // 10 minutes in seconds

function signSession(data: AuthFlowSession, secret: string): string {
  const payload = JSON.stringify(data);
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('hex');
  return `${encoded}.${sig}`;
}

function verifySession(
  value: string,
  secret: string
): AuthFlowSession | null {
  const dotIndex = value.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const encoded = value.slice(0, dotIndex);
  const sig = value.slice(dotIndex + 1);

  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('hex');

  try {
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  } catch {
    return null;
  }

  try {
    const payload = Buffer.from(encoded, 'base64url').toString('utf8');
    return JSON.parse(payload) as AuthFlowSession;
  } catch {
    return null;
  }
}

export function setSession(
  res: Response,
  data: AuthFlowSession,
  secret: string
): void {
  const value = signSession(data, secret);
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE * 1000,
  });
}

export function getSession(req: Request, secret: string): AuthFlowSession | null {
  const value = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!value) return null;
  return verifySession(value, secret);
}
