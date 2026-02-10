/**
 * Constellation API functions (backlinks service)
 */

import { externalApiClient } from "../client";
import type { BacklinksResponse } from "../types";

const CONSTELLATION_BASE_URL = "https://constellation.microcosm.blue";

/**
 * Fetch backlinks for a given subject
 */
export async function getBacklinks(
  subject: string,
  source: string,
  limit = 50
): Promise<BacklinksResponse["records"]> {
  const url = new URL(
    "/xrpc/blue.microcosm.links.getBacklinks",
    CONSTELLATION_BASE_URL
  );
  url.searchParams.set("subject", subject);
  url.searchParams.set("source", source);
  url.searchParams.set("limit", String(limit));

  const response = await externalApiClient<BacklinksResponse>(url.toString());
  return response.records;
}

/**
 * Fetch evidence links for a hypercert
 */
export async function getEvidenceLinks(
  hypercertUri: string
): Promise<BacklinksResponse["records"]> {
  return getBacklinks(
    hypercertUri,
    "org.hypercerts.claim.attachment:subjects[com.atproto.repo.strongRef].uri"
  );
}

/**
 * Fetch evaluation links for a hypercert
 */
export async function getEvaluationLinks(
  hypercertUri: string
): Promise<BacklinksResponse["records"]> {
  return getBacklinks(
    hypercertUri,
    "org.hypercerts.claim.evaluation:subject.uri"
  );
}

/**
 * Fetch measurement links for a hypercert
 */
export async function getMeasurementLinks(
  hypercertUri: string
): Promise<BacklinksResponse["records"]> {
  return getBacklinks(
    hypercertUri,
    "org.hypercerts.claim.measurement:subject.uri"
  );
}
