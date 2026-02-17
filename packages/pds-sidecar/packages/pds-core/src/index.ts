// PDS Core — wraps @atproto/pds with two additions:
//   1. Metadata override middleware: rewrites `authorization_endpoint` in
//      /.well-known/oauth-authorization-server to point to the sidecar.
//   2. /oauth/magic-callback endpoint: accepts HMAC-signed callbacks from the
//      sidecar and issues OAuth authorization codes.
//
// Environment variables:
//   PDS_HOSTNAME              — e.g. pds.certs.network
//   PDS_DATA_DIRECTORY        — path to PDS data directory
//   PDS_BLOBSTORE_DISK_LOCATION — blob storage path
//   PDS_DID_PLC_URL           — PLC directory URL
//   PDS_ADMIN_PASSWORD        — PDS admin password
//   PDS_JWT_SECRET            — JWT signing secret
//   PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX — PLC rotation key (hex)
//   AUTH_SERVICE_URL          — sidecar URL (e.g. https://auth.pds.certs.network)
//   CALLBACK_SECRET           — shared HMAC secret for signed callbacks

import { PDS, envToCfg, envToSecrets, readEnv } from '@atproto/pds';
import { createDatabase, CallbackSigner } from '@certified/shared';
import { createMetadataOverride } from './metadata-override.js';
import { createMagicCallback } from './magic-callback.js';
import { AccountCreator } from './account-creator.js';

export async function startPDS(): Promise<void> {
  // --- Configuration ---
  const env = readEnv();
  const cfg = envToCfg(env);
  const secrets = envToSecrets(env);

  const authServiceUrl = process.env['AUTH_SERVICE_URL'];
  if (!authServiceUrl) {
    throw new Error('AUTH_SERVICE_URL environment variable is required');
  }

  const callbackSecret = process.env['CALLBACK_SECRET'];
  if (!callbackSecret) {
    throw new Error('CALLBACK_SECRET environment variable is required');
  }

  const sidecarDbPath =
    process.env['SIDECAR_DB_PATH'] ??
    `${process.env['PDS_DATA_DIRECTORY'] ?? '.'}/sidecar.sqlite`;

  // --- Create PDS instance ---
  const pds = await PDS.create(cfg, secrets);

  // --- Mount metadata override BEFORE PDS middleware ---
  // This intercepts /.well-known/oauth-authorization-server and rewrites
  // `authorization_endpoint` to point to the sidecar auth service.
  // Must be mounted before the PDS's own middleware stack.
  pds.app.use(createMetadataOverride(authServiceUrl));

  // --- Set up sidecar database and helpers ---
  const sidecarDb = createDatabase(sidecarDbPath);
  const callbackSigner = new CallbackSigner(callbackSecret);
  const pdsDomain = cfg.service.hostname;
  const accountCreator = new AccountCreator(pds, pdsDomain, sidecarDb);

  // --- Mount magic-callback endpoint ---
  pds.app.get(
    '/oauth/magic-callback',
    createMagicCallback(pds, callbackSigner, accountCreator),
  );

  // --- Start the server ---
  await pds.start();

  console.log(
    `PDS core started on port ${cfg.service.port} (hostname: ${cfg.service.hostname})`,
  );
  console.log(`  Auth service URL: ${authServiceUrl}`);
  console.log(`  Metadata override: /.well-known/oauth-authorization-server`);
  console.log(`  Magic callback: /oauth/magic-callback`);
}

// Run if this is the entry point
startPDS().catch((err) => {
  console.error('Failed to start PDS:', err);
  process.exit(1);
});
