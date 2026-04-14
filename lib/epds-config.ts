import { config } from "@/lib/config";

/**
 * Returns the ePDS OAuth endpoints derived from NEXT_PUBLIC_EPDS_URL.
 *
 * Given epdsUrl = "https://pds-eu-west4.test.certified.app":
 *   - parEndpoint:   "https://pds-eu-west4.test.certified.app/oauth/par"
 *   - authEndpoint:  "https://auth.pds-eu-west4.test.certified.app/oauth/authorize"
 *   - tokenEndpoint: "https://pds-eu-west4.test.certified.app/oauth/token"
 *
 * @throws {Error} if NEXT_PUBLIC_EPDS_URL is not set
 */
export function getEpdsEndpoints(): {
  parEndpoint: string;
  authEndpoint: string;
  tokenEndpoint: string;
} {
  if (!config.epdsUrl) {
    throw new Error(
      "NEXT_PUBLIC_EPDS_URL is not set. " +
        "This environment variable is required for ePDS login. " +
        "Set it to the ePDS PDS base URL, e.g. https://pds-eu-west4.test.certified.app",
    );
  }

  const epdsUrl = config.epdsUrl;
  const normalizedUrl = epdsUrl.replace(/\/+$/, "");
  const url = new URL(epdsUrl);
  const authHost = url.port
    ? `auth.${url.hostname}:${url.port}`
    : `auth.${url.hostname}`;

  return {
    parEndpoint: `${normalizedUrl}/oauth/par`,
    authEndpoint: `${url.protocol}//${authHost}/oauth/authorize`,
    tokenEndpoint: `${normalizedUrl}/oauth/token`,
  };
}

/**
 * Returns the OAuth client ID for ePDS login.
 * This is the same client ID as the existing ATProto flow — the app is the
 * same OAuth client regardless of login method.
 *
 * @throws {Error} if NEXT_PUBLIC_EPDS_URL is not set
 */
export function getEpdsClientId(): string {
  if (!config.epdsUrl) {
    throw new Error(
      "NEXT_PUBLIC_EPDS_URL is not set. " +
        "This environment variable is required for ePDS login.",
    );
  }

  return config.epdsClientId;
}

/**
 * Returns the redirect URI for the ePDS OAuth callback.
 *
 * @throws {Error} if NEXT_PUBLIC_EPDS_URL is not set
 */
export function getEpdsRedirectUri(): string {
  if (!config.epdsUrl) {
    throw new Error(
      "NEXT_PUBLIC_EPDS_URL is not set. " +
        "This environment variable is required for ePDS login.",
    );
  }

  return config.epdsRedirectUri;
}

export const EPDS_HANDLE_MODES = [
  "random",
  "picker",
  "picker-with-random",
] as const;
export type EpdsHandleMode = (typeof EPDS_HANDLE_MODES)[number];
