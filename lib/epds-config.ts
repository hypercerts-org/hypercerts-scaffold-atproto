import { config } from "@/lib/config";
import type { EpdsOAuthEndpoints } from "@/lib/types";

const EPDS_METADATA_TIMEOUT_MS = 15_000;

let epdsEndpointsPromise: Promise<EpdsOAuthEndpoints> | undefined;

/**
 * Returns the configured ePDS base URL or throws a setup-focused error.
 */
function getRequiredEpdsUrl(): string {
  if (!config.epdsUrl) {
    throw new Error(
      "NEXT_PUBLIC_EPDS_URL is not set. " +
        "This environment variable is required for ePDS login. " +
        "Set it to the ePDS PDS base URL, e.g. https://test.gainforest.app.",
    );
  }

  try {
    new URL(config.epdsUrl);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_EPDS_URL: ${config.epdsUrl}. ` +
        "ePDS OAuth discovery needs an absolute PDS base URL, " +
        "for example https://test.gainforest.app.",
    );
  }

  return config.epdsUrl;
}

/**
 * Builds the OAuth protected-resource metadata URL for an ePDS PDS base URL.
 */
function getProtectedResourceMetadataUrl(epdsUrl: string): string {
  const metadataUrl = new URL(epdsUrl);
  metadataUrl.pathname = "/.well-known/oauth-protected-resource";
  metadataUrl.search = "";
  metadataUrl.hash = "";
  return metadataUrl.toString();
}

/**
 * Builds an authorization-server metadata URL from the issuer advertised by
 * protected-resource metadata.
 */
function getAuthorizationServerMetadataUrl(issuer: string): string {
  const metadataUrl = new URL(issuer);
  const issuerPath = metadataUrl.pathname === "/" ? "" : metadataUrl.pathname;
  metadataUrl.pathname = `/.well-known/oauth-authorization-server${issuerPath}`;
  metadataUrl.search = "";
  metadataUrl.hash = "";
  return metadataUrl.toString();
}

/**
 * Checks whether a parsed JSON value is an object record.
 */
function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Fetches and validates a well-known OAuth metadata object.
 */
async function fetchMetadataObject(
  url: string,
  label: string,
): Promise<Record<string, unknown>> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(EPDS_METADATA_TIMEOUT_MS),
    });
  } catch {
    throw new Error(
      `Failed to fetch ${label} metadata from ${url}. ` +
        "The app discovers ePDS OAuth endpoints from public .well-known metadata. " +
        "Make sure NEXT_PUBLIC_EPDS_URL points at the PDS base URL and that the metadata endpoint is reachable.",
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${label} metadata from ${url}: ` +
        `${response.status} ${response.statusText}. ` +
        "The metadata endpoint must be public so the app can discover OAuth endpoints.",
    );
  }

  const metadata: unknown = await response.json().catch(() => null);
  if (!isObjectRecord(metadata)) {
    throw new Error(
      `${label} metadata from ${url} was not a JSON object. ` +
        "Return valid OAuth metadata JSON from this .well-known endpoint.",
    );
  }

  return metadata;
}

/**
 * Reads a required URL string field from OAuth metadata.
 */
function readRequiredUrlField(
  metadata: Record<string, unknown>,
  fieldName: string,
  metadataUrl: string,
): string {
  const value = metadata[fieldName];
  if (typeof value !== "string") {
    throw new Error(
      `OAuth metadata at ${metadataUrl} is missing ${fieldName}. ` +
        `The ePDS OAuth flow needs ${fieldName} to be a URL string. ` +
        "Fix the authorization-server metadata and try again.",
    );
  }

  try {
    new URL(value);
  } catch {
    throw new Error(
      `OAuth metadata at ${metadataUrl} has an invalid ${fieldName}: ${value}. ` +
        `${fieldName} must be an absolute URL. Fix the metadata and try again.`,
    );
  }

  return value;
}

/**
 * Reads the first authorization server advertised by protected-resource metadata.
 */
function readFirstAuthorizationServer(
  metadata: Record<string, unknown>,
  metadataUrl: string,
): string {
  const authorizationServers = metadata.authorization_servers;
  if (!Array.isArray(authorizationServers)) {
    throw new Error(
      `OAuth protected-resource metadata at ${metadataUrl} is missing authorization_servers. ` +
        "The app needs authorization_servers[0] to discover the ePDS authorization server. " +
        "Add at least one authorization server URL to the metadata.",
    );
  }

  const firstAuthorizationServer = authorizationServers[0];
  if (typeof firstAuthorizationServer !== "string") {
    throw new Error(
      `OAuth protected-resource metadata at ${metadataUrl} has no authorization_servers[0]. ` +
        "The app uses the first authorization server from the PDS metadata. " +
        "Add a URL string as the first authorization server.",
    );
  }

  try {
    new URL(firstAuthorizationServer);
  } catch {
    throw new Error(
      `OAuth protected-resource metadata at ${metadataUrl} has an invalid authorization_servers[0]: ${firstAuthorizationServer}. ` +
        "authorization_servers[0] must be an absolute URL. Fix the metadata and try again.",
    );
  }

  return firstAuthorizationServer;
}

/**
 * Discovers ePDS OAuth endpoints from well-known OAuth metadata.
 */
async function discoverEpdsEndpoints(
  epdsUrl: string,
): Promise<EpdsOAuthEndpoints> {
  const protectedResourceMetadataUrl = getProtectedResourceMetadataUrl(epdsUrl);
  const protectedResourceMetadata = await fetchMetadataObject(
    protectedResourceMetadataUrl,
    "OAuth protected-resource",
  );
  const authorizationServer = readFirstAuthorizationServer(
    protectedResourceMetadata,
    protectedResourceMetadataUrl,
  );

  const authorizationServerMetadataUrl =
    getAuthorizationServerMetadataUrl(authorizationServer);
  const authorizationServerMetadata = await fetchMetadataObject(
    authorizationServerMetadataUrl,
    "OAuth authorization-server",
  );

  return {
    issuer: readRequiredUrlField(
      authorizationServerMetadata,
      "issuer",
      authorizationServerMetadataUrl,
    ),
    parEndpoint: readRequiredUrlField(
      authorizationServerMetadata,
      "pushed_authorization_request_endpoint",
      authorizationServerMetadataUrl,
    ),
    authEndpoint: readRequiredUrlField(
      authorizationServerMetadata,
      "authorization_endpoint",
      authorizationServerMetadataUrl,
    ),
    tokenEndpoint: readRequiredUrlField(
      authorizationServerMetadata,
      "token_endpoint",
      authorizationServerMetadataUrl,
    ),
  };
}

/**
 * Returns the ePDS OAuth endpoints discovered from the PDS well-known metadata.
 *
 * Discovery starts at NEXT_PUBLIC_EPDS_URL, reads
 * `/.well-known/oauth-protected-resource`, takes `authorization_servers[0]`,
 * then reads that issuer's `/.well-known/oauth-authorization-server` metadata.
 * This lets deployments use auth hosts such as `auth-test.gainforest.app`
 * without relying on hostname conventions.
 *
 * @throws {Error} if NEXT_PUBLIC_EPDS_URL is not set or OAuth metadata is missing
 */
export async function getEpdsEndpoints(): Promise<EpdsOAuthEndpoints> {
  const epdsUrl = getRequiredEpdsUrl();

  if (!epdsEndpointsPromise) {
    epdsEndpointsPromise = discoverEpdsEndpoints(epdsUrl).catch((error) => {
      epdsEndpointsPromise = undefined;
      throw error;
    });
  }

  return epdsEndpointsPromise;
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
