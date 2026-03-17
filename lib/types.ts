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
