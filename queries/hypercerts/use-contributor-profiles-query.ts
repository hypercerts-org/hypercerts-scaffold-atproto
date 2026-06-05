"use client";

import { useQueries } from "@tanstack/react-query";
import { getProfile } from "@/lib/api/external/bluesky";
import {
  getContributionRecord,
  getContributorInformationRecord,
} from "@/lib/create-actions";
import { queryKeys } from "@/lib/api/query-keys";
import { parseAtUri } from "@/lib/utils";
import type { DisplayContributor } from "@/lib/contributor-utils";
import type { BlueskyProfile } from "@/lib/api/types";

/**
 * For each DisplayContributor with isDid=true, fetch their Bluesky profile.
 * Returns a Map<string, BlueskyProfile> keyed by DID.
 * Non-DID contributors are skipped (no query created).
 * Failed lookups are silently ignored (retry: false, no throw).
 */
export function useContributorProfilesQuery(
  contributors: DisplayContributor[],
) {
  const didContributors = contributors.filter((c) => c.isDid);
  // Deduplicate DIDs
  const uniqueDids = [...new Set(didContributors.map((c) => c.identity))];

  const queries = useQueries({
    queries: uniqueDids.map((did) => ({
      queryKey: queryKeys.hypercerts.contributorProfile(did),
      queryFn: () => getProfile(did),
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 min cache
    })),
  });

  // Build a Map<did, BlueskyProfile> from successful queries
  const profileMap = new Map<string, BlueskyProfile>();
  queries.forEach((q, i) => {
    if (q.isSuccess && q.data) {
      profileMap.set(uniqueDids[i], q.data);
    }
  });

  const isLoading = queries.some((q) => q.isLoading);

  return { profileMap, isLoading };
}

interface ResolvedContributorInfo {
  identifier: string; // the actual DID, domain, URI, or org identifier from the record
  displayName?: string;
}

interface ResolvedContributionDetails {
  role?: string;
  contributionDescription?: string;
  startDate?: string;
  endDate?: string;
}

function strongRefKey(ref: { uri: string; cid: string }): string {
  return `${ref.uri}#${ref.cid}`;
}

/**
 * For each DisplayContributor with needsResolution=true, fetch the contributorInformation
 * record to get the actual contributor DID.
 * Returns a Map<string, ResolvedContributorInfo> keyed by the placeholder identity (the AT URI).
 */
export function useResolveContributorIdentities(
  contributors: DisplayContributor[],
) {
  const needsResolution = contributors.filter(
    (c) => c.needsResolution && c.identityRef && parseAtUri(c.identityRef.uri),
  );

  const queries = useQueries({
    queries: needsResolution.map((c) => {
      const ref = c.identityRef!;
      const { did, collection, rkey } = parseAtUri(ref.uri)!;
      return {
        queryKey: queryKeys.hypercerts.contributorInformation(
          did,
          rkey,
          ref.cid,
        ),
        queryFn: () =>
          getContributorInformationRecord({
            did,
            collection,
            rkey,
            cid: ref.cid,
          }),
        retry: 1,
        staleTime: 10 * 60 * 1000,
      };
    }),
  });

  const resolvedMap = new Map<string, ResolvedContributorInfo>();
  queries.forEach((q, i) => {
    if (q.isSuccess && q.data?.value) {
      const val = q.data.value as { identifier?: string; displayName?: string };
      const identifier = val.identifier?.trim();
      if (identifier) {
        resolvedMap.set(strongRefKey(needsResolution[i].identityRef!), {
          identifier,
          displayName: val.displayName,
        });
      }
    }
  });

  const isLoading = queries.some((q) => q.isLoading);
  return { resolvedMap, isLoading };
}

/**
 * Resolves StrongRef contribution detail records into displayable role,
 * description, and contribution timeframe fields.
 */
export function useResolveContributionDetails(
  contributors: DisplayContributor[],
) {
  const uniqueRefs = [
    ...new Map(
      contributors
        .filter((c) => c.detailsRef && parseAtUri(c.detailsRef.uri))
        .map((c) => [strongRefKey(c.detailsRef!), c.detailsRef!]),
    ).values(),
  ];

  const queries = useQueries({
    queries: uniqueRefs.map((ref) => {
      const { did, collection, rkey } = parseAtUri(ref.uri)!;
      return {
        queryKey: queryKeys.hypercerts.contributionDetails(did, rkey, ref.cid),
        queryFn: () =>
          getContributionRecord({ did, collection, rkey, cid: ref.cid }),
        retry: 1,
        staleTime: 10 * 60 * 1000,
      };
    }),
  });

  const detailsMap = new Map<string, ResolvedContributionDetails>();
  queries.forEach((q, i) => {
    if (q.isSuccess && q.data?.value) {
      const val = q.data.value as ResolvedContributionDetails;
      detailsMap.set(strongRefKey(uniqueRefs[i]), {
        role: val.role,
        contributionDescription: val.contributionDescription,
        startDate: val.startDate,
        endDate: val.endDate,
      });
    }
  });

  const isLoading = queries.some((q) => q.isLoading);
  return { detailsMap, isLoading };
}
