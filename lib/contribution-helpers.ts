import "server-only";

import { parseAtUri } from "@/lib/utils";
import type { RepoContext } from "@/lib/repo-context";
import { assertValidRecord } from "@/lib/record-validation";
import { coerceAtprotoDatetime, currentAtprotoDatetime } from "@/lib/datetime";
import { normalizeContributionWeight as normalizeContributionWeightValue } from "@/lib/contribution-validation";
import {
  OrgHypercertsClaimContribution,
  OrgHypercertsClaimContributorInformation,
  OrgHypercertsClaimActivity,
} from "@hypercerts-org/lexicon";

export { normalizeContributionWeight } from "@/lib/contribution-validation";

const normalizeLegacyDescription = (record: {
  description?: unknown;
}): void => {
  const legacyDescription = record.description;
  if (typeof legacyDescription === "string") {
    record.description = {
      $type: "org.hypercerts.defs#descriptionString",
      value: legacyDescription,
    };
  }
};

/**
 * Contribution payload used when appending contributor records to an activity.
 * Each entry creates one contribution-details record and one contributor-info
 * record per contributor, then links them from the activity claim.
 */
export interface ContributionEntry {
  contributors: string[];
  role: string;
  contributionDescription?: string;
  startDate?: string;
  endDate?: string;
  /** Relative contribution weight stored on each linked activity contributor. */
  weight?: string;
}

interface NormalizedContributionEntry extends ContributionEntry {
  contributors: string[];
  role: string;
  weight?: string;
}

function normalizeContributionEntry(
  contribution: ContributionEntry,
  index: number,
): NormalizedContributionEntry {
  const contributors = (
    Array.isArray(contribution.contributors) ? contribution.contributors : []
  )
    .filter(
      (identifier): identifier is string => typeof identifier === "string",
    )
    .map((identifier) => identifier.trim())
    .filter((identifier) => identifier !== "");
  const role =
    typeof contribution.role === "string" ? contribution.role.trim() : "";

  if (contributors.length === 0) {
    throw new Error(
      "Invalid contribution: at least one contributor identifier is required.",
    );
  }
  if (!role) {
    throw new Error("Invalid contribution: role is required.");
  }

  return {
    ...contribution,
    contributors,
    role,
    contributionDescription:
      contribution.contributionDescription?.trim() || undefined,
    weight: normalizeContributionWeightValue(
      contribution.weight,
      `contributions[${index}].weight`,
    ),
  };
}

/**
 * Core contribution processing logic. Takes an already-resolved RepoContext
 * so it can be called from both the "use server" addContribution action and
 * directly from API routes that already have ctx.
 */
export const processContributions = async (
  ctx: RepoContext,
  hypercertUri: string,
  contributions: ContributionEntry[],
): Promise<{ uri: string; cid: string }> => {
  if (!contributions || contributions.length === 0) {
    throw new Error(
      "processContributions failed: contributions array is empty.",
    );
  }

  // 1. Parse and validate the hypercertUri before any writes
  const hypercertParsed = parseAtUri(hypercertUri);
  if (
    !hypercertParsed ||
    !hypercertParsed.collection ||
    !hypercertParsed.rkey
  ) {
    throw new Error("processContributions failed: invalid hypercertUri.");
  }

  // 2. Ownership check — must happen before any writes
  if (hypercertParsed.did !== ctx.userDid) {
    throw new Error(
      "processContributions failed: cannot modify another user's hypercert.",
    );
  }

  // Validate all entries before any child records are created.
  const normalizedContributions = contributions.map(normalizeContributionEntry);

  // 3. Fetch the existing hypercert record before creating child records
  const existingHypercertResult = await ctx.agent.com.atproto.repo.getRecord({
    repo: hypercertParsed.did,
    collection: hypercertParsed.collection,
    rkey: hypercertParsed.rkey,
  });
  const existingRecord = existingHypercertResult.data.value as Record<
    string,
    unknown
  >;

  const allNewContributors: unknown[] = [];
  const createdChildRefs: Array<{ uri: string; cid: string }> = [];

  try {
    for (const contribution of normalizedContributions) {
      const normalizedStartDate = contribution.startDate
        ? coerceAtprotoDatetime(
            contribution.startDate,
            "contribution startDate",
          )
        : undefined;
      const normalizedEndDate = contribution.endDate
        ? coerceAtprotoDatetime(contribution.endDate, "contribution endDate")
        : undefined;

      // 4. Create contributionDetails record
      const detailsRecord: OrgHypercertsClaimContribution.Record = {
        $type: "org.hypercerts.claim.contribution",
        role: contribution.role,
        createdAt: currentAtprotoDatetime(),
        ...(contribution.contributionDescription
          ? { contributionDescription: contribution.contributionDescription }
          : {}),
        ...(normalizedStartDate ? { startDate: normalizedStartDate } : {}),
        ...(normalizedEndDate ? { endDate: normalizedEndDate } : {}),
      };

      assertValidRecord(
        "contributionDetails",
        detailsRecord,
        OrgHypercertsClaimContribution.validateRecord,
      );
      const detailsResult = await ctx.agent.com.atproto.repo.createRecord({
        repo: ctx.userDid,
        collection: "org.hypercerts.claim.contribution",
        record: detailsRecord,
      });
      const detailsRef = {
        uri: detailsResult.data.uri,
        cid: detailsResult.data.cid,
      };
      createdChildRefs.push(detailsRef);

      // 5. Create contributorInformation records for each contributor
      const contributorRefs: Array<{ uri: string; cid: string }> = [];
      for (const identifier of contribution.contributors) {
        const infoRecord: OrgHypercertsClaimContributorInformation.Record = {
          $type: "org.hypercerts.claim.contributorInformation",
          identifier,
          createdAt: currentAtprotoDatetime(),
        };
        assertValidRecord(
          "contributorInformation",
          infoRecord,
          OrgHypercertsClaimContributorInformation.validateRecord,
        );
        const infoResult = await ctx.agent.com.atproto.repo.createRecord({
          repo: ctx.userDid,
          collection: "org.hypercerts.claim.contributorInformation",
          record: infoRecord,
        });
        const infoRef = {
          uri: infoResult.data.uri,
          cid: infoResult.data.cid,
        };
        createdChildRefs.push(infoRef);
        contributorRefs.push(infoRef);
      }

      // Build new contributor entries for this contribution
      const newContributors = contributorRefs.map((ref) => ({
        contributorIdentity: {
          $type: "com.atproto.repo.strongRef" as const,
          ...ref,
        },
        contributionDetails: {
          $type: "com.atproto.repo.strongRef" as const,
          ...detailsRef,
        },
        ...(contribution.weight
          ? { contributionWeight: contribution.weight }
          : {}),
      }));

      allNewContributors.push(...newContributors);
    }

    const existingContributors =
      (existingRecord.contributors as unknown[]) || [];
    existingRecord.contributors = [
      ...existingContributors,
      ...allNewContributors,
    ];

    // 6. Update hypercert with appended contributors
    normalizeLegacyDescription(existingRecord);
    assertValidRecord(
      "activity",
      existingRecord,
      OrgHypercertsClaimActivity.validateRecord,
    );
    const putResult = await ctx.agent.com.atproto.repo.putRecord({
      repo: ctx.userDid,
      collection: hypercertParsed.collection,
      rkey: hypercertParsed.rkey,
      record: existingRecord,
    });

    return { uri: putResult.data.uri, cid: putResult.data.cid };
  } catch (error) {
    const cleanupResults = await Promise.allSettled(
      createdChildRefs.map((ref) => {
        const parsed = parseAtUri(ref.uri);
        if (!parsed?.collection || !parsed.rkey) return Promise.resolve();
        return ctx.agent.com.atproto.repo.deleteRecord({
          repo: ctx.userDid,
          collection: parsed.collection,
          rkey: parsed.rkey,
        });
      }),
    );

    for (const result of cleanupResults) {
      if (result.status === "rejected") {
        console.error(
          "processContributions child cleanup failed:",
          result.reason,
        );
      }
    }

    throw error;
  }
};
