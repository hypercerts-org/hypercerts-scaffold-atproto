import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type Database from 'better-sqlite3';
import type { OTPService, Mailer, RateLimiter, CallbackSigner } from '@certified/shared';
import { securityHeaders } from './middleware/security.js';
import { csrfProtection } from './middleware/csrf.js';
import { createAuthorizeRouter } from './routes/authorize.js';
import { createSendCodeRouter } from './routes/send-code.js';
import { createVerifyCodeRouter } from './routes/verify-code.js';

export interface AppOptions {
  otpService: OTPService;
  mailer: Mailer;
  rateLimiter: RateLimiter;
  callbackSigner: CallbackSigner;
  db: Database.Database;
  sessionSecret: string;
  pdsUrl: string;
}

export function createApp(opts: AppOptions): express.Application {
  const { otpService, mailer, rateLimiter, callbackSigner, db, sessionSecret, pdsUrl } = opts;

  const app = express();

  // Global middleware
  app.use(securityHeaders);
  app.use(express.json());
  app.use(cors());
  app.use(cookieParser());
  app.use(csrfProtection);

  // Health check route
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Auth routes
  app.use(createAuthorizeRouter({ otpService, mailer, sessionSecret }));
  app.use(createSendCodeRouter({ otpService, mailer, rateLimiter, sessionSecret }));
  app.use(createVerifyCodeRouter({ otpService, rateLimiter, callbackSigner, db, sessionSecret, pdsUrl }));

  return app;
}
