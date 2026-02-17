// account-creator.ts
// Creates new ATProto accounts on the PDS for first-time email OTP users.
//
// Uses the PDS's internal OAuthStore.createAccount() which handles the full
// ATProto account creation flow (PLC DID creation, repo init, sequencing).
//
// Internal API note: Accesses pds.ctx (AppContext) via `as any` cast since
// the PDS class exposes `ctx` as a public property but the type is not
// exported in a way that's easily importable. Tested against @atproto/pds ^0.4.0.

import crypto from 'node:crypto';
import type { PDS } from '@atproto/pds';
import type Database from 'better-sqlite3';

/**
 * Generates a random base-36 string of the given length.
 * Used to create random handles like `a3x9kf.pds.certs.network`.
 */
function randomBase36(length: number): string {
  const bytes = crypto.randomBytes(Math.ceil(length * 2));
  return bytes
    .toString('hex')
    .split('')
    .map((c) => parseInt(c, 16).toString(36))
    .join('')
    .slice(0, length);
}

export class AccountCreator {
  constructor(
    // Internal API: pds.ctx is AppContext (public property on PDS class).
    // Accessed via `as any` since AppContext is not re-exported cleanly.
    // Tested against @atproto/pds ^0.4.0.
    private readonly pds: PDS,
    private readonly pdsDomain: string,
    private readonly sidecarDb: Database.Database,
  ) {}

  /**
   * Creates a new ATProto account for the given email address.
   *
   * 1. Generates a random handle: `${randomBase36(6)}.${pdsDomain}`
   * 2. Generates a random throwaway password
   * 3. Creates the account via the PDS's internal OAuthStore
   * 4. Stores the email→DID mapping in the sidecar's accounts table
   * 5. Returns `{ did, handle }`
   */
  async createAccount(email: string): Promise<{ did: string; handle: string }> {
    const handle = `${randomBase36(6)}.${this.pdsDomain}`;
    const password = crypto.randomBytes(64).toString('hex');

    // Internal API: pds.ctx is the AppContext instance.
    // oauthProvider is an OAuthProvider instance (may be undefined if OAuth is disabled).
    // Tested against @atproto/pds ^0.4.0.
    const ctx = (this.pds as any).ctx;

    // Use the OAuthStore's createAccount which handles the full ATProto
    // account creation flow (PLC DID, repo init, sequencing).
    // Internal API: ctx.oauthProvider is OAuthProvider from @atproto/oauth-provider.
    // Its store property is the OAuthStore which implements AccountStore.
    // Tested against @atproto/pds ^0.4.0.
    const oauthProvider = ctx.oauthProvider;
    if (!oauthProvider) {
      throw new Error('OAuthProvider is not configured on this PDS instance');
    }

    // Internal API: oauthProvider.store is the OAuthStore (AccountStore implementation).
    // Tested against @atproto/pds ^0.4.0.
    const store = (oauthProvider as any).store;

    const account = await store.createAccount({
      handle,
      email,
      password,
      locale: 'en',
    });

    const did: string = account.sub;

    // Store the email→DID mapping in the sidecar's accounts table
    this.sidecarDb
      .prepare(
        `INSERT INTO accounts (email, did, handle)
         VALUES (?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET did = excluded.did, handle = excluded.handle`,
      )
      .run(email, did, handle);

    return { did, handle };
  }
}
