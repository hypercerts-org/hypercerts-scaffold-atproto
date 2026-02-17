export { createDatabase } from './db.js';
export type { Account, OTPToken, RateLimitEntry } from './types.js';
export { logger } from './logger.js';
export { OTPService } from './otp-service.js';
export {
  RateLimiter,
  rateLimitMiddleware,
  RATE_LIMITS,
} from './rate-limiter.js';
export type {
  RateLimitResult,
  GenericRequest,
  GenericResponse,
  NextFunction,
  RequestHandler,
} from './rate-limiter.js';
