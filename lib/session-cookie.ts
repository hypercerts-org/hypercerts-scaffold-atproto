import "server-only";

import { config } from "@/lib/config";

export const SESSION_COOKIE_NAME = "sid";
export const LEGACY_USER_DID_COOKIE_NAME = "user-did";
export const LEGACY_ACTIVE_DID_COOKIE_NAME = "active-did";

export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
};

export function generateSessionId(): string {
  return crypto.randomUUID();
}
