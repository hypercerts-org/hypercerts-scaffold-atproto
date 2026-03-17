import type {
  OrgHypercertsClaimActivity,
  ComAtprotoRepoStrongRef,
} from "@hypercerts-org/lexicon";

type Contributor = OrgHypercertsClaimActivity.Contributor;
type ContributorIdentity = OrgHypercertsClaimActivity.ContributorIdentity;
type ContributorRole = OrgHypercertsClaimActivity.ContributorRole;
type StrongRef = ComAtprotoRepoStrongRef.Main;

/** Parsed contributor ready for display */
export interface DisplayContributor {
  identity: string;
  isDid: boolean;
  role?: string;
  weight?: string;
  identityRef?: StrongRef;
  detailsRef?: StrongRef;
  needsResolution: boolean; // true when identity comes from a StrongRef that needs fetching
  displayName?: string; // resolved displayName from contributorInformation record
}

/** Type guard: checks if value is a ContributorIdentity (has `identity` string field) */
function isContributorIdentity(v: unknown): v is ContributorIdentity {
  return (
    typeof v === "object" &&
    v !== null &&
    "identity" in v &&
    typeof (v as Record<string, unknown>).identity === "string"
  );
}

/** Type guard: checks if value is a ContributorRole (has `role` string field) */
function isContributorRole(v: unknown): v is ContributorRole {
  return (
    typeof v === "object" &&
    v !== null &&
    "role" in v &&
    typeof (v as Record<string, unknown>).role === "string"
  );
}

/** Type guard: checks if value is a StrongRef (has `uri` and `cid` string fields) */
function isStrongRef(v: unknown): v is StrongRef {
  return (
    typeof v === "object" &&
    v !== null &&
    "uri" in v &&
    "cid" in v &&
    typeof (v as Record<string, unknown>).uri === "string" &&
    typeof (v as Record<string, unknown>).cid === "string"
  );
}

/**
 * Parses a single Contributor record into a DisplayContributor ready for UI rendering.
 *
 * Logic:
 * 1. Resolve `contributorIdentity`:
 *    - ContributorIdentity (has `identity` field) → use identity string directly
 *    - StrongRef (has `uri` + `cid`) → extract DID from AT URI, set identityRef
 *    - Fallback → stringify
 * 2. Resolve `contributionDetails`:
 *    - ContributorRole (has `role` field) → use role string
 *    - StrongRef → set detailsRef, role stays undefined
 * 3. isDid = identity.startsWith("did:")
 * 4. weight = contributionWeight
 */
function parseContributor(contributor: Contributor): DisplayContributor {
  let identity = "";
  let identityRef: StrongRef | undefined;
  let needsResolution = false;

  const rawIdentity = contributor.contributorIdentity;

  if (isContributorIdentity(rawIdentity)) {
    identity = rawIdentity.identity;
  } else if (isStrongRef(rawIdentity)) {
    identityRef = rawIdentity;
    // Use the full URI as a unique placeholder — do NOT extract DID from it
    // (extracting the DID would give the repo owner's DID, not the contributor's DID)
    identity = rawIdentity.uri;
    needsResolution = true;
  } else if (rawIdentity == null) {
    identity = "Unknown contributor";
  } else {
    identity = String(rawIdentity);
  }

  let role: string | undefined;
  let detailsRef: StrongRef | undefined;

  const rawDetails = contributor.contributionDetails;

  if (rawDetails !== undefined) {
    if (isContributorRole(rawDetails)) {
      role = rawDetails.role;
    } else if (isStrongRef(rawDetails)) {
      detailsRef = rawDetails;
    }
  }

  const isDid = identity.startsWith("did:");
  const weight = contributor.contributionWeight;

  return {
    identity,
    isDid,
    role,
    weight,
    identityRef,
    detailsRef,
    needsResolution,
  };
}

/**
 * Parses an array of Contributor records into DisplayContributors.
 * Returns an empty array if contributors is undefined or empty.
 */
export function parseContributors(
  contributors?: Contributor[],
): DisplayContributor[] {
  if (!contributors || contributors.length === 0) {
    return [];
  }
  return contributors.map(parseContributor);
}
