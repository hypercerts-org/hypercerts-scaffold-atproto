#!/usr/bin/env node
/**
 * Generate a JWK private key for ATProto OAuth authentication
 *
 * This script generates the ATPROTO_JWK_PRIVATE value needed in your .env.local file.
 */

import { generateKeyPair, exportJWK } from 'jose';
import { randomUUID } from 'crypto';

async function generateJWK() {
  // Check if stdout is redirected to a file
  const isRedirected = !process.stdout.isTTY;

  console.error('🔐 Generating JWK private key for ATProto OAuth...\n');

  try {
    // Generate ES256 key pair
    const { privateKey } = await generateKeyPair('ES256');
    const jwk = await exportJWK(privateKey);

    // Add required properties
    jwk.kid = randomUUID();
    jwk.alg = 'ES256';
    jwk.key_ops = ['sign'];
    // Remove 'use' property - it's deprecated in favor of 'key_ops'
    delete jwk.use;

    // Format as JWK Set
    const jwkSet = { keys: [jwk] };
    const jwkString = JSON.stringify(jwkSet);

    console.error('✅ JWK generated successfully!');
    if (!isRedirected) {
      console.error('\nAdd this to your .env.local file:\n');
    }
    console.log(`ATPROTO_JWK_PRIVATE='${jwkString}'`);
    console.error('\n⚠️  Important: Keep this key secure and never commit it to git!');

  } catch (error) {
    console.error('❌ Error generating JWK:', error.message);
    process.exit(1);
  }
}

generateJWK();
