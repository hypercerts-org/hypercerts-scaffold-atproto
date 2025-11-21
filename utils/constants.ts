export const PLC_DIRECTORY_URL_DEFAULT = undefined;
export const PLC_DIRECTORY_URL: string | undefined = PLC_DIRECTORY_URL_DEFAULT;
export const PDS_URL = "https://pds-eu-west4.test.certified.app/";

export const HANDLE_RESOLVER_URL_DEFAULT = PDS_URL
export const HANDLE_RESOLVER_URL: string = HANDLE_RESOLVER_URL_DEFAULT;

export const SIGN_UP_URL_DEFAULT = "https://pds-eu-west4.test.certified.app/";
export const SIGN_UP_URL: string = SIGN_UP_URL_DEFAULT;

export const OAUTH_SCOPE_DEFAULT: string = "atproto transition:generic";

export const getLoopBackCanonicalLocation = () => {
  return Object.assign(new URL(window.location.origin), {
    protocol: "http:",
    hostname: "127.0.0.1",
  }).href as `http://127.0.0.1/${string}`;
};

const baseUrl = "https://maearth-test.vercel.app";
export const METADATA = {
  client_id: `${baseUrl}/client-metadata.json`,
  client_name: "GainForest",
  client_uri: baseUrl,
  redirect_uris: [`${baseUrl}`] as [string, ...string[]],
  scope: "atproto transition:generic",
  grant_types: ["authorization_code", "refresh_token"] as [
    "authorization_code",
    "refresh_token"
  ],
  response_types: ["code"] as ["code"],
  token_endpoint_auth_method: "none" as const,
  application_type: "web" as const,
  dpop_bound_access_tokens: true,
};