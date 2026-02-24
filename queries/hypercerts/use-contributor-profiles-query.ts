"use client";

import { useQueries } from "@tanstack/react-query";
import { getProfile } from "@/lib/api/external/bluesky";
import { getContributorInformationRecord } from "@/lib/create-actions";
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
  identifier: string; // the actual DID from the contributorInformation record
  displayName?: string;
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
        queryKey: queryKeys.hypercerts.contributorInformation(did, rkey),
        queryFn: () =>
          getContributorInformationRecord({ did, collection, rkey }),
        retry: 1,
        staleTime: 10 * 60 * 1000,
      };
    }),
  });

  const resolvedMap = new Map<string, ResolvedContributorInfo>();
  queries.forEach((q, i) => {
    if (q.isSuccess && q.data?.value) {
      const val = q.data.value as { identifier?: string; displayName?: string };
      resolvedMap.set(needsResolution[i].identity, {
        identifier: val.identifier || "",
        displayName: val.displayName,
      });
    }
  });

  const isLoading = queries.some((q) => q.isLoading);
  return { resolvedMap, isLoading };
}
