import type { OrgHypercertsClaimActivity as HypercertRecord } from "@hypercerts-org/lexicon";
import type { OrgHypercertsClaimContribution as HypercertContribution } from "@hypercerts-org/lexicon";
import type { OrgHypercertsContextAttachment as HypercertEvidence } from "@hypercerts-org/lexicon";
import type { OrgHypercertsClaimRights as HypercertRights } from "@hypercerts-org/lexicon";
import type { AppCertifiedLocation as HypercertLocation } from "@hypercerts-org/lexicon";
import type { ComAtprotoRepoGetRecord } from "@atproto/api";

export type HypercertEvidenceData = Omit<
  ComAtprotoRepoGetRecord.OutputSchema,
  "value"
> & {
  value: HypercertEvidence.Record;
};

export type HypercertRecordData = Omit<
  ComAtprotoRepoGetRecord.OutputSchema,
  "value"
> & {
  value: HypercertRecord.Record;
};

export type HypercertRightsData = Omit<
  ComAtprotoRepoGetRecord.OutputSchema,
  "value"
> & {
  value: HypercertRights.Record;
};
export type HypercertLocationData = Omit<
  ComAtprotoRepoGetRecord.OutputSchema,
  "value"
> & {
  value: HypercertLocation.Record;
};

export type HypercertContributionData = Omit<
  ComAtprotoRepoGetRecord.OutputSchema,
  "value"
> & {
  value: HypercertContribution.Record;
};

export interface UpdateResult {
  uri: string;
  cid: string;
}

export interface CreateHypercertResult {
  hypercertUri: string;
  rightsUri: string;
  hypercertCid: string;
  rightsCid: string;
  locationUris?: string[];
}

export interface CreateHypercertParams {
  title: string;
  description: string;
  shortDescription: string;
  startDate: string;
  endDate: string;
  rights: {
    rightsName: string;
    rightsType: string;
    rightsDescription: string;
  };
  workScope?: string[]; // tags as array of strings (converted to WorkScopeString at API level)
  image?: Blob;
  contributions?: Array<{
    contributors: Array<
      string | { identity: string } | { uri: string; cid: string }
    >;
    contributionDetails:
      | string
      | {
          role: string;
          contributionDescription?: string;
          startDate?: string;
          endDate?: string;
        }
      | { uri: string; cid: string };
    weight?: string;
  }>;
  locations?: Array<string | Record<string, unknown>>;
  shortDescriptionFacets?: unknown[];
  descriptionFacets?: unknown[];
}

export interface BaseHypercertFormProps {
  hypercertInfo?: CreateHypercertResult;
}

export enum Collections {
  claim = "org.hypercerts.claim.activity",
  contribution = "org.hypercerts.claim.contribution",
  evidence = "org.hypercerts.context.attachment",
  location = "app.certified.location",
  rights = "org.hypercerts.claim.rights",
  evaluation = "org.hypercerts.context.evaluation",
}

export function isRecordObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
