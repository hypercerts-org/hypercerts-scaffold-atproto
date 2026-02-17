import {
  createDatabase,
  OTPService,
  RateLimiter,
  Mailer,
  CallbackSigner,
  logger,
} from '@certified/shared';
import { createApp } from './app.js';

// Configuration from environment
const PORT = process.env.AUTH_PORT || 3001;
const DB_PATH = process.env.AUTH_DB_PATH || ':memory:';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-in-production';
const CALLBACK_SECRET = process.env.CALLBACK_SECRET || 'dev-callback-secret-change-in-production';
const PDS_URL = process.env.PDS_URL || 'http://localhost:3000';

const SMTP_HOST = process.env.SMTP_HOST || 'localhost';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'Hypercerts Scaffold <noreply@example.com>';

// Initialize services
const db = createDatabase(DB_PATH);
const otpService = new OTPService(db);
const rateLimiter = new RateLimiter(db);
const mailer = new Mailer({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  from: SMTP_FROM,
});
const callbackSigner = new CallbackSigner(CALLBACK_SECRET);

// Periodic cleanup
setInterval(() => {
  otpService.cleanupExpired().catch((err: unknown) => logger.error({ err }, 'OTP cleanup failed'));
  rateLimiter.cleanupOld().catch((err: unknown) => logger.error({ err }, 'Rate limit cleanup failed'));
}, 5 * 60 * 1000);

const app = createApp({
  otpService,
  mailer,
  rateLimiter,
  callbackSigner,
  db,
  sessionSecret: SESSION_SECRET,
  pdsUrl: PDS_URL,
});

app.listen(PORT, () => {
  logger.info(`Auth service listening on port ${PORT}`);
});

export default app;
