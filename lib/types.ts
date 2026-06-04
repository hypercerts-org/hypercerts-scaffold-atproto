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

export interface EpdsOAuthEndpoints {
  /**
   * OAuth issuer selected from the ePDS protected-resource metadata.
   * Store this value with tokens issued by the manual ePDS OAuth flow.
   */
  issuer: string;

  /**
   * Endpoint used to submit pushed authorization requests before redirecting
   * the user to the browser authorization flow.
   */
  parEndpoint: string;

  /**
   * Browser endpoint where users authenticate or create an ePDS account.
   */
  authEndpoint: string;

  /**
   * Endpoint used by the callback route to exchange an authorization code for
   * ePDS access and refresh tokens.
   */
  tokenEndpoint: string;
}

export enum Collections {
  claim = "org.hypercerts.claim.activity",
  contribution = "org.hypercerts.claim.contribution",
  evidence = "org.hypercerts.context.attachment",
  location = "app.certified.location",
  rights = "org.hypercerts.claim.rights",
  evaluation = "org.hypercerts.context.evaluation",
}
