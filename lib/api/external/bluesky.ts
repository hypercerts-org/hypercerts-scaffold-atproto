/**
 * Bluesky API functions
 */

import { APIError, externalApiClient } from "../client";
import type { BlueskyProfile, BlueskySearchActorsResponse } from "../types";

const BLUESKY_PUBLIC_API = "https://public.api.bsky.app";

/**
 * Get a Bluesky profile by actor (DID or handle)
 */
export async function getProfile(actor: string): Promise<BlueskyProfile> {
  const url = new URL("/xrpc/app.bsky.actor.getProfile", BLUESKY_PUBLIC_API);
  url.searchParams.set("actor", actor);

  return externalApiClient<BlueskyProfile>(url.toString());
}

/**
 * Search for actors on Bluesky
 */
export async function searchActors(
  query: string,
  limit = 10,
): Promise<BlueskyProfile[]> {
  if (!query.trim()) {
    return [];
  }

  const url = new URL("/xrpc/app.bsky.actor.searchActors", BLUESKY_PUBLIC_API);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const response = await externalApiClient<BlueskySearchActorsResponse>(
    url.toString(),
  );
  return response.actors || [];
}

/**
 * Request a password reset email for the given address
 */
export async function requestPasswordReset(
  email: string,
  pdsUrl: string,
): Promise<void> {
  const normalizedUrl = pdsUrl.replace(/\/+$/, "");
  const url = `${normalizedUrl}/xrpc/com.atproto.server.requestPasswordReset`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorData: unknown = await response.json();
      if (
        typeof errorData === "object" &&
        errorData !== null &&
        "message" in errorData
      ) {
        errorMessage = (errorData as { message: string }).message;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new APIError(response.status, errorMessage);
  }
}

/**
 * Reset a password using a token received via email
 */
export async function resetPassword(
  token: string,
  password: string,
  pdsUrl: string,
): Promise<void> {
  const normalizedUrl = pdsUrl.replace(/\/+$/, "");
  const url = `${normalizedUrl}/xrpc/com.atproto.server.resetPassword`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorData: unknown = await response.json();
      if (
        typeof errorData === "object" &&
        errorData !== null &&
        "message" in errorData
      ) {
        errorMessage = (errorData as { message: string }).message;
      } else if (
        typeof errorData === "object" &&
        errorData !== null &&
        "error" in errorData
      ) {
        errorMessage = (errorData as { error: string }).error;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new APIError(response.status, errorMessage);
  }
}
