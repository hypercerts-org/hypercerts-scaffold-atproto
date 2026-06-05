import "server-only";

import {
  OrgHypercertsClaimActivity,
  OrgHypercertsClaimContribution,
  OrgHypercertsClaimContributorInformation,
} from "@hypercerts-org/lexicon";

import { normalizeContributionWeight } from "@/lib/contribution-helpers";
import type { RepoContext } from "@/lib/repo-context";
import {
  getDescriptionText,
  parseAtUri,
  resolveHypercertImageUrl,
} from "@/lib/utils";

/**
 * Strong reference shape used by ATProto records to point at another record.
 * Use this guard before resolving contributor or contribution detail records.
 */
interface StrongRefLike {
  uri: string;
  cid: string;
  $type?: string;
}

/**
 * A contributor tile ready for the activity claim grid UI.
 * The weight is numeric for layout, while weightLabel preserves the record text.
 */
export interface ActivityGridContributor {
  id: string;
  identity: string;
  displayName: string;
  role?: string;
  weight: number;
  weightLabel: string;
  percentage: number;
  imageUrl: string;
  sourceUri?: string;
}

/**
 * Activity claim data prepared for the Hyperboards-style grid page.
 * Each claim includes resolved contributor metadata and image URLs for rendering.
 */
export interface ActivityGridClaim {
  uri: string;
  cid: string;
  title: string;
  shortDescription: string;
  description: string;
  createdAt?: string;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
  workScope: string[];
  contributors: ActivityGridContributor[];
  totalWeight: number;
}

/**
 * Parameters required to load activity claims for the current repository.
 * Pass the authenticated repo context agent and the session PDS URL for blobs.
 */
export interface GetActivityGridClaimsParams {
  agent: RepoContext["agent"];
  ownerDid: string;
  pdsUrl?: string;
  limit?: number;
}

interface ResolvedContributorIdentity {
  identity: string;
  displayName?: string;
  imageUrl?: string;
  sourceUri?: string;
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStrongRefLike(value: unknown): value is StrongRefLike {
  return (
    isRecordObject(value) &&
    typeof value.uri === "string" &&
    typeof value.cid === "string"
  );
}

function hasIdentity(value: unknown): value is { identity: string } {
  return isRecordObject(value) && typeof value.identity === "string";
}

function hasRole(value: unknown): value is { role: string } {
  return isRecordObject(value) && typeof value.role === "string";
}

function parseDisplayWeight(rawWeight: string | undefined): {
  value: number;
  label: string;
} {
  try {
    const normalized = normalizeContributionWeight(rawWeight);
    if (!normalized) return { value: 1, label: "1" };
    return { value: Number(normalized), label: normalized };
  } catch {
    return { value: 1, label: "1" };
  }
}

function prettifyIdentity(identity: string, fallbackIndex: number): string {
  if (!identity.trim()) return `Contributor ${fallbackIndex + 1}`;

  if (identity.startsWith("did:")) {
    return `${identity.slice(0, 12)}…${identity.slice(-5)}`;
  }

  try {
    const url = new URL(identity);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return identity.replace(/^@/, "");
  }
}

function generatedContributorImageUrl(seed: string): string {
  const safeSeed = seed.trim() || "hypercert-contributor";
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
    safeSeed,
  )}&backgroundColor=d9f99d,fef3c7,bfdbfe,c7d2fe,fbcfe8`;
}

function getWorkScope(record: OrgHypercertsClaimActivity.Record): string[] {
  if (
    record.workScope &&
    OrgHypercertsClaimActivity.isWorkScopeString(record.workScope)
  ) {
    return record.workScope.scope
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean);
  }

  return [];
}

async function getRecordValue(
  agent: RepoContext["agent"],
  ref: StrongRefLike,
): Promise<unknown | undefined> {
  const parsed = parseAtUri(ref.uri);
  if (!parsed) return undefined;

  const result = await agent.com.atproto.repo
    .getRecord({
      repo: parsed.did,
      collection: parsed.collection,
      rkey: parsed.rkey,
    })
    .catch((error: unknown) => {
      console.warn("getActivityGridClaims: failed to resolve record", {
        uri: ref.uri,
        error,
      });
      return null;
    });

  return result?.data.value;
}

async function resolveContributorIdentity(
  agent: RepoContext["agent"],
  contributorIdentity: OrgHypercertsClaimActivity.Contributor["contributorIdentity"],
  pdsUrl: string | undefined,
): Promise<ResolvedContributorIdentity> {
  if (hasIdentity(contributorIdentity)) {
    return { identity: contributorIdentity.identity };
  }

  if (!isStrongRefLike(contributorIdentity)) {
    return { identity: "Unknown contributor" };
  }

  const parsed = parseAtUri(contributorIdentity.uri);
  const value = await getRecordValue(agent, contributorIdentity);

  if (!OrgHypercertsClaimContributorInformation.isRecord(value)) {
    return {
      identity: contributorIdentity.uri,
      sourceUri: contributorIdentity.uri,
    };
  }

  const record = value as OrgHypercertsClaimContributorInformation.Record;
  const imageUrl = parsed
    ? resolveHypercertImageUrl(record.image, parsed.did, pdsUrl)
    : undefined;

  return {
    identity: record.identifier || contributorIdentity.uri,
    displayName: record.displayName,
    imageUrl,
    sourceUri: contributorIdentity.uri,
  };
}

async function resolveContributionRole(
  agent: RepoContext["agent"],
  contributionDetails:
    | OrgHypercertsClaimActivity.Contributor["contributionDetails"]
    | undefined,
): Promise<string | undefined> {
  if (!contributionDetails) return undefined;

  if (hasRole(contributionDetails)) {
    return contributionDetails.role;
  }

  if (!isStrongRefLike(contributionDetails)) {
    return undefined;
  }

  const value = await getRecordValue(agent, contributionDetails);

  if (!OrgHypercertsClaimContribution.isRecord(value)) {
    return undefined;
  }

  const record = value as OrgHypercertsClaimContribution.Record;
  return record.role || undefined;
}

async function buildContributor(
  agent: RepoContext["agent"],
  contributor: OrgHypercertsClaimActivity.Contributor,
  index: number,
  pdsUrl: string | undefined,
): Promise<Omit<ActivityGridContributor, "percentage">> {
  const [identity, role] = await Promise.all([
    resolveContributorIdentity(agent, contributor.contributorIdentity, pdsUrl),
    resolveContributionRole(agent, contributor.contributionDetails),
  ]);

  const displayName =
    identity.displayName || prettifyIdentity(identity.identity, index);
  const weight = parseDisplayWeight(contributor.contributionWeight);

  return {
    id: identity.sourceUri || `${identity.identity}-${index}`,
    identity: identity.identity,
    displayName,
    role,
    weight: weight.value,
    weightLabel: weight.label,
    imageUrl: identity.imageUrl || generatedContributorImageUrl(displayName),
    sourceUri: identity.sourceUri,
  };
}

async function buildClaim(
  agent: RepoContext["agent"],
  ownerDid: string,
  pdsUrl: string | undefined,
  uri: string,
  cid: string,
  record: OrgHypercertsClaimActivity.Record,
): Promise<ActivityGridClaim> {
  const rawContributors = Array.isArray(record.contributors)
    ? record.contributors
    : [];
  const contributorsWithoutPercentages = await Promise.all(
    rawContributors.map((contributor, index) =>
      buildContributor(agent, contributor, index, pdsUrl),
    ),
  );
  const totalWeight = contributorsWithoutPercentages.reduce(
    (sum, contributor) => sum + contributor.weight,
    0,
  );
  const contributors = contributorsWithoutPercentages
    .map((contributor) => ({
      ...contributor,
      percentage:
        totalWeight > 0 ? (contributor.weight / totalWeight) * 100 : 0,
    }))
    .sort((a, b) => b.weight - a.weight);

  return {
    uri,
    cid,
    title: record.title || "Untitled activity claim",
    shortDescription: record.shortDescription || "No short description yet.",
    description: getDescriptionText(record.description),
    createdAt: record.createdAt,
    startDate: record.startDate,
    endDate: record.endDate,
    imageUrl: resolveHypercertImageUrl(record.image, ownerDid, pdsUrl),
    workScope: getWorkScope(record),
    contributors,
    totalWeight,
  };
}

/**
 * Load the signed-in user's activity claims and resolve contributor metadata.
 * Records are sorted newest-first so the page highlights recent impact first.
 */
export async function getActivityGridClaims({
  agent,
  ownerDid,
  pdsUrl,
  limit = 100,
}: GetActivityGridClaimsParams): Promise<ActivityGridClaim[]> {
  const result = await agent.com.atproto.repo.listRecords({
    repo: ownerDid,
    collection: "org.hypercerts.claim.activity",
    limit,
  });

  const records = result.data.records
    .filter((record) => OrgHypercertsClaimActivity.isRecord(record.value))
    .map((record) => ({
      uri: record.uri,
      cid: record.cid,
      value: record.value as OrgHypercertsClaimActivity.Record,
    }));

  const claims = await Promise.all(
    records.map((record) =>
      buildClaim(agent, ownerDid, pdsUrl, record.uri, record.cid, record.value),
    ),
  );

  return claims.sort((a, b) => {
    const left = a.createdAt ? Date.parse(a.createdAt) : 0;
    const right = b.createdAt ? Date.parse(b.createdAt) : 0;
    return right - left;
  });
}
