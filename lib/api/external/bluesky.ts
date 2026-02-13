/**
 * Bluesky API functions
 */

import { externalApiClient, APIError } from "../client";
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
  limit = 10
): Promise<BlueskyProfile[]> {
  if (!query.trim()) {
    return [];
  }

  const url = new URL("/xrpc/app.bsky.actor.searchActors", BLUESKY_PUBLIC_API);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const response = await externalApiClient<BlueskySearchActorsResponse>(
    url.toString()
  );
  return response.actors || [];
}

