/**
 * Application Configuration
 * 
 * Centralized configuration with auto-detection for different environments:
 * - Local development: Uses 127.0.0.1 (RFC 8252 compliant)
 * - Vercel production/preview: Auto-detects from VERCEL_URL
 * - Custom deployments: Uses NEXT_PUBLIC_BASE_URL
 * 
 * @see https://datatracker.ietf.org/doc/html/rfc8252 (OAuth for Native Apps)
 */

import { ATPROTO_SCOPE, TRANSITION_SCOPES } from "@hypercerts-org/sdk-core";

/**
 * OAuth scope configuration
 * Currently using transition:generic, will migrate to granular scopes
 * also during local development transition:generic is a requirement
 */
export const OAUTH_SCOPE = [ATPROTO_SCOPE, TRANSITION_SCOPES.GENERIC].join(" ");

/**
 * Validates a URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a URL is a loopback address (local development)
 */
function isLoopback(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]" ||
      parsed.hostname === "localhost"
    );
  } catch {
    return false;
  }
}

/**
 * Get the base URL for the application
 * Priority:
 * 1. NEXT_PUBLIC_BASE_URL (explicit configuration)
 * 2. VERCEL_URL (auto-detect Vercel deployments)
 * 3. Fallback to 127.0.0.1:3000 (local development)
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://127.0.0.1:3000";
}

/**
 * Validates the base URL configuration
 * Throws descriptive errors if validation fails
 */
function validateBaseUrl(url: string): void {
  if (!isValidUrl(url)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_BASE_URL: "${url}" is not a valid URL.\n` +
      `Expected format: http://127.0.0.1:3000 (local) or https://yourdomain.com (production)`
    );
  }

  const parsed = new URL(url);

  if (isLoopback(url)) {
    if (parsed.protocol !== "http:") {
      throw new Error(
        `Invalid NEXT_PUBLIC_BASE_URL: Loopback addresses must use HTTP, not HTTPS.\n` +
        `Current: ${url}\n` +
        `Expected: http://127.0.0.1:${parsed.port || 3000}`
      );
    }

    // Must use IP address (127.0.0.1), not hostname (localhost)
    // This is required by RFC 8252 for security (prevents DNS rebinding attacks)
    if (parsed.hostname === "localhost") {
      throw new Error(
        `Invalid NEXT_PUBLIC_BASE_URL: Loopback must use IP address, not hostname.\n` +
        `Current: ${url}\n` +
        `Expected: http://127.0.0.1:${parsed.port || 3000}\n`
      );
    }

    // Must include port for loopback
    if (!parsed.port) {
      throw new Error(
        `Invalid NEXT_PUBLIC_BASE_URL: Loopback addresses must include a port.\n` +
        `Current: ${url}\n` +
        `Expected: http://127.0.0.1:3000`
      );
    }
  } else {
    // For production/public URLs
    // Must use HTTPS
    if (parsed.protocol !== "https:") {
      throw new Error(
        `Invalid NEXT_PUBLIC_BASE_URL: Production URLs must use HTTPS.\n` +
        `Current: ${url}\n` +
        `Expected: https://${parsed.hostname}`
      );
    }
  }
}

/**
 * Get the redirect base URL (RFC 8252 compliant)
 * For loopback, ensures we use 127.0.0.1 (not localhost)
 */
function getRedirectBaseUrl(baseUrl: string): string {
  if (isLoopback(baseUrl)) {
    return baseUrl.replace("localhost", "127.0.0.1");
  }
  return baseUrl;
}

/**
 * Build OAuth client ID according to ATProto spec
 * - Loopback: http://localhost?scope=...&redirect_uri=...
 * - Production: https://yourdomain.com/client-metadata.json
 */
function buildClientId(
  baseUrl: string,
  scope: string,
  redirectUri: string
): string {
  if (isLoopback(baseUrl)) {
    // ATProto loopback client_id uses "http://localhost" (not IP)
    // but embeds the IP-based redirect_uri
    const params = new URLSearchParams({
      scope,
      redirect_uri: redirectUri,
    });
    return `http://localhost?${params.toString()}`;
  }

  return `${baseUrl}/client-metadata.json`;
}

const baseUrl = getBaseUrl();
try {
  validateBaseUrl(baseUrl);
} catch (error) {
  console.error("\n❌ Configuration Error:\n");
  throw error;
}

const redirectBaseUrl = getRedirectBaseUrl(baseUrl);
const redirectUri = `${redirectBaseUrl}/api/auth/callback`;
const jwksUri = `${redirectBaseUrl}/jwks.json`;
const clientId = buildClientId(baseUrl, OAUTH_SCOPE, redirectUri);

// Environment flags
const isLoopbackMode = isLoopback(baseUrl);
const isDevelopment = process.env.NODE_ENV !== "production";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Application configuration object
 * Single source of truth for all URLs and environment settings
 */
export const config = {
  // Core URLs
  baseUrl,
  redirectBaseUrl,
  
  // Environment flags
  isLoopback: isLoopbackMode,
  isDevelopment,
  isProduction,
  
  // OAuth configuration
  clientId,
  redirectUri,
  jwksUri,
  scope: OAUTH_SCOPE,
  
  // Network endpoints
  pdsUrl: process.env.NEXT_PUBLIC_PDS_URL!,
  certifiedPdsUrl: process.env.CERTIFIED_PDS_URL || process.env.NEXT_PUBLIC_PDS_URL || 'https://certified.app',
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST!,
    port: process.env.REDIS_PORT!,
    password: process.env.REDIS_PASSWORD!,
  },
  
  // Private keys (server-only, not exposed to client)
  jwkPrivate: process.env.ATPROTO_JWK_PRIVATE!,
} as const;

// Validate required environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_PDS_URL",
  "ATPROTO_JWK_PRIVATE",
  "REDIS_HOST",
  "REDIS_PORT",
  "REDIS_PASSWORD",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `Missing required environment variable: ${envVar}\n` +
      `Please check your .env.local file.`
    );
  }
}

// Log configuration at startup (helpful for debugging)
if (typeof window === "undefined") {
  console.log("\n🔧 Application Configuration:");
  console.log(`   Environment: ${isProduction ? "production" : "development"}`);
  console.log(`   Mode: ${isLoopbackMode ? "loopback (local)" : "production"}`);
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   Client ID: ${clientId}`);
  console.log(`   Redirect URI: ${redirectUri}`);
  console.log(`   JWKS URI: ${jwksUri}`);
  console.log(`   PDS: ${config.pdsUrl}\n`);
}
