export const PLC_DIRECTORY_URL_DEFAULT = undefined;
export const PLC_DIRECTORY_URL: string | undefined = PLC_DIRECTORY_URL_DEFAULT;

export const HANDLE_RESOLVER_URL_DEFAULT =
  "https://pds-eu-west4.test.certified.app/";
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
