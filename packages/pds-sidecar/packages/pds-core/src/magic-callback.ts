// magic-callback.ts
// Handles GET /oauth/magic-callback — the signed callback from the sidecar
// auth service that issues an OAuth authorization code.
//
// After the sidecar verifies the user's OTP, it redirects the user's browser
// here with HMAC-signed parameters. This handler:
//   1. Verifies the HMAC signature
//   2. Optionally creates a new ATProto account (if newAccount === true)
//   3. Looks up the user's DID from the PDS's account manager
//   4. Creates/loads a device session via the OAuthProvider's DeviceManager
//   5. Calls requestManager.setAuthorized() to issue an auth code
//   6. Redirects the user to the client app via /oauth/authorize/redirect
//
// Internal API notes (all accessed via `as any` — tested against @atproto/pds ^0.4.0):
//   - pds.ctx.oauthProvider — OAuthProvider instance
//   - pds.ctx.oauthProvider.deviceManager — DeviceManager for device sessions
//   - pds.ctx.oauthProvider.requestManager — RequestManager for PAR requests
//   - pds.ctx.oauthProvider.clientManager — ClientManager to load client metadata
//   - pds.ctx.oauthProvider.accountManager — OAuthProvider's AccountManager
//   - pds.ctx.accountManager — PDS AccountManager (looks up accounts by email)

import type { RequestHandler } from 'express';
import type { PDS } from '@atproto/pds';
import { CallbackSigner } from '@certified/shared';
import type { AccountCreator } from './account-creator.js';

/**
 * Creates the Express request handler for GET /oauth/magic-callback.
 *
 * @param pds - The PDS instance
 * @param callbackSigner - The HMAC signer used to verify the callback
 * @param accountCreator - The account creator for new users
 */
export function createMagicCallback(
  pds: PDS,
  callbackSigner: CallbackSigner,
  accountCreator: AccountCreator,
): RequestHandler {
  return async function magicCallback(req, res) {
    try {
      // 1. Parse query parameters using CallbackSigner.parseCallbackUrl
      const fullUrl = new URL(
        req.url,
        `${req.protocol}://${req.headers.host}`,
      );
      const { params, signature } = CallbackSigner.parseCallbackUrl(fullUrl);

      // 2. Verify the HMAC signature (default maxAge = 300 seconds)
      const verification = callbackSigner.verify(params, signature);
      if (!verification.valid) {
        res.status(403).json({ error: verification.error ?? 'Forbidden' });
        return;
      }

      // 3. Check approval
      if (!params.approved) {
        res.status(403).json({ error: 'Request not approved' });
        return;
      }

      // Internal API: pds.ctx is AppContext (public property on PDS class).
      // Tested against @atproto/pds ^0.4.0.
      const ctx = (pds as any).ctx;

      // Internal API: ctx.oauthProvider is OAuthProvider from @atproto/oauth-provider.
      // Tested against @atproto/pds ^0.4.0.
      const oauthProvider = ctx.oauthProvider;
      if (!oauthProvider) {
        res.status(500).json({ error: 'OAuthProvider not configured' });
        return;
      }

      // 4. If newAccount === true, create the ATProto account
      if (params.newAccount) {
        await accountCreator.createAccount(params.email);
      }

      // 5. Look up the user's DID from the PDS's internal account manager
      // Internal API: ctx.accountManager is the PDS AccountManager.
      // Tested against @atproto/pds ^0.4.0.
      const pdsAccountManager = ctx.accountManager;
      const actorAccount = await pdsAccountManager.getAccountByEmail(
        params.email,
      );
      if (!actorAccount) {
        res.status(403).json({ error: 'Account not found for email' });
        return;
      }
      const did: string = actorAccount.did;

      // 6. Create or load a device session via the OAuthProvider's DeviceManager
      // Internal API: oauthProvider.deviceManager is DeviceManager.
      // Tested against @atproto/pds ^0.4.0.
      const deviceManager = (oauthProvider as any).deviceManager;
      const { deviceId, deviceMetadata } = await deviceManager.load(
        req,
        res,
      );

      // 7. Load the PAR request to get client info and parameters
      // Internal API: oauthProvider.requestManager is RequestManager.
      // Tested against @atproto/pds ^0.4.0.
      const requestManager = (oauthProvider as any).requestManager;
      const { clientId, parameters } = await requestManager.get(
        params.requestUri,
        deviceId,
      );

      // 8. Load the client object
      // Internal API: oauthProvider.clientManager is ClientManager.
      // Tested against @atproto/pds ^0.4.0.
      const clientManager = (oauthProvider as any).clientManager;
      const client = await clientManager.getClient(clientId);

      // 9. Register the device-account association in the OAuthProvider's account store
      // Internal API: oauthProvider.accountManager is the OAuthProvider's AccountManager.
      // Tested against @atproto/pds ^0.4.0.
      const oauthAccountManager = (oauthProvider as any).accountManager;
      await oauthAccountManager.upsertDeviceAccount(deviceId, did);

      // 10. Build the Account object for setAuthorized
      const { account } = await oauthAccountManager.getAccount(did);

      // 11. Mark the request as authorized and generate an authorization code
      const code = await requestManager.setAuthorized(
        params.requestUri,
        client,
        account,
        deviceId,
        deviceMetadata,
      );

      // 12. Build the redirect URL back to the client app via the PDS's
      //     /oauth/authorize/redirect endpoint (which handles the final redirect).
      // Internal API: oauthProvider.issuer is the PDS's issuer URL.
      // Tested against @atproto/pds ^0.4.0.
      const issuer: string = (oauthProvider as any).issuer;
      const redirectUrl = new URL('/oauth/authorize/redirect', issuer);

      // Build redirect params following the OAuth 2.0 authorization code flow
      const redirectUri = parameters.redirect_uri as string;
      const redirectMode =
        (parameters.response_mode as string | undefined) ?? 'query';

      redirectUrl.searchParams.set('redirect_mode', redirectMode);
      redirectUrl.searchParams.set('redirect_uri', redirectUri);
      redirectUrl.searchParams.set('code', code);
      if (parameters.state) {
        redirectUrl.searchParams.set('state', parameters.state as string);
      }
      // iss parameter per RFC 9207
      redirectUrl.searchParams.set('iss', issuer);

      res.redirect(redirectUrl.toString());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      res.status(500).json({ error: message });
    }
  };
}
