import { createATProtoSDK } from "@hypercerts-org/sdk-core";
import { RedisSessionStore, RedisStateStore } from "./redis-state-store";

if (!process.env.ATPROTO_JWK_PRIVATE || !process.env.NEXT_PUBLIC_APP_URL || !process.env.NEXT_PUBLIC_PDS_URL) {
  throw new Error("Some environment vars missing");
}

export const sessionStore = new RedisSessionStore();
export const stateStore = new RedisStateStore();

const sdk = createATProtoSDK({
  oauth: {
    clientId: `${process.env.NEXT_PUBLIC_APP_URL}/client-metadata.json`,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    scope: "atproto transition:generic",
    jwksUri: `${process.env.NEXT_PUBLIC_APP_URL}/jwks.json`,
    jwkPrivate: process.env.ATPROTO_JWK_PRIVATE,
  },
  storage: {
    sessionStore,
    stateStore,
  },
  servers: {
    pds: process.env.NEXT_PUBLIC_PDS_URL,
  },
});

export default sdk;
