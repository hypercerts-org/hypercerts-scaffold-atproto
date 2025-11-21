import type * as HypercertRecord from "@/lexicons/types/org/hypercerts/claim";
import type * as HypercertContribution from "@/lexicons/types/org/hypercerts/claim/contribution";
import type * as HypercertEvidence from "@/lexicons/types/org/hypercerts/claim/evidence";
import type * as HypercertRights from "@/lexicons/types/org/hypercerts/claim/rights";
import type * as HypercertLocation from "@/lexicons/types/app/certified/location";
import { ComAtprotoRepoGetRecord } from "@atproto/api";

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

export enum Collections {
  claim = "org.hypercerts.claim",
  contribution = "org.hypercerts.claim.contribution",
  evidence = "org.hypercerts.claim.evidence",
  location = "app.certified.location",
  rights = "org.hypercerts.claim.rights",
}
