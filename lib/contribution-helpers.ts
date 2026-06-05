import "server-only";
import { parseAtUri } from "@/lib/utils";
import type { RepoContext } from "@/lib/repo-context";
import { assertValidRecord } from "@/lib/record-validation";
import { coerceAtprotoDatetime, currentAtprotoDatetime } from "@/lib/datetime";
import {
  OrgHypercertsClaimContribution,
  OrgHypercertsClaimContributorInformation,
  OrgHypercertsClaimActivity,
} from "@hypercerts-org/lexicon";

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

/**
 * Normalize and validate a contribution weight before writing it to a record.
 * Use this when accepting API or form input so invalid weights fail before any
 * child records are created. Returns `undefined` when no weight was supplied.
 */
export function normalizeContributionWeight(
  weight: string | undefined,
  label = "contribution weight",
): string | undefined {
  if (weight === undefined || weight.trim() === "") return undefined;

  const normalized = weight.trim();
  const isDecimal = /^\d+(?:\.\d+)?$/.test(normalized);
  const parsed = Number(normalized);

  if (!isDecimal || !Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid ${label}: expected a positive numeric string such as "1", "2.5", or "0.25".`,
    );
  }

  return normalized;
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

  // 2. Ownership check — must happen before any child record writes
  if (hypercertParsed.did !== ctx.userDid) {
    throw new Error(
      "processContributions failed: cannot modify another user's hypercert.",
    );
  }

  const normalizedContributions = contributions.map((contribution, index) => ({
    ...contribution,
    weight: normalizeContributionWeight(
      contribution.weight,
      `contributions[${index}].weight`,
    ),
  }));

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

  for (const contribution of normalizedContributions) {
    const normalizedStartDate = contribution.startDate
      ? coerceAtprotoDatetime(contribution.startDate, "contribution startDate")
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

    // 5. Create contributorInformation records for each contributor
    const contributorRefs = await Promise.all(
      contribution.contributors.map(async (identifier) => {
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
        return { uri: infoResult.data.uri, cid: infoResult.data.cid };
      }),
    );

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

  const existingContributors = (existingRecord.contributors as unknown[]) || [];
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
};
