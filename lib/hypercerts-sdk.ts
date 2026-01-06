import { createATProtoSDK } from "@hypercerts-org/sdk-core";

if (!process.env.ATPROTO_JWK_PRIVATE || !process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error("Some environment vars missing");
}

import {
  InMemorySessionStore,
  InMemoryStateStore,
} from "@hypercerts-org/sdk-core";

export const sessionStore = new InMemorySessionStore();
export const stateStore = new InMemoryStateStore();

console.log("Session Store", sessionStore);
console.log("State Store", stateStore);

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
});

export default sdk;
