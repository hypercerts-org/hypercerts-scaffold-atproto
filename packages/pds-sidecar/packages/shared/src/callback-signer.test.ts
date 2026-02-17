import { describe, it, expect, vi } from 'vitest';
import crypto from 'node:crypto';
import { CallbackSigner, type CallbackParams } from './callback-signer.js';

const SECRET = 'test-secret-key';
const NOW = Math.floor(Date.now() / 1000);

const BASE_PARAMS: CallbackParams = {
  requestUri: 'urn:ietf:params:oauth:request_uri:abc123',
  email: 'user@example.com',
  approved: true,
  newAccount: false,
  timestamp: NOW,
};

describe('CallbackSigner', () => {
  // Test 1: sign produces a consistent signature for the same inputs
  it('sign produces a consistent signature for the same inputs', () => {
    const signer = new CallbackSigner(SECRET);
    const sig1 = signer.sign(BASE_PARAMS);
    const sig2 = signer.sign(BASE_PARAMS);
    expect(sig1).toBe(sig2);
    expect(sig1).toMatch(/^[0-9a-f]{64}$/);
  });

  // Test 2: sign produces different signatures for different inputs
  it('sign produces different signatures for different inputs', () => {
    const signer = new CallbackSigner(SECRET);
    const sig1 = signer.sign(BASE_PARAMS);
    const sig2 = signer.sign({ ...BASE_PARAMS, email: 'other@example.com' });
    expect(sig1).not.toBe(sig2);
  });

  // Test 3: verify succeeds with a valid signature
  it('verify succeeds with a valid signature', () => {
    const signer = new CallbackSigner(SECRET);
    const sig = signer.sign(BASE_PARAMS);
    const result = signer.verify(BASE_PARAMS, sig);
    expect(result).toEqual({ valid: true });
  });

  // Test 4: verify fails with a tampered email
  it('verify fails with a tampered email', () => {
    const signer = new CallbackSigner(SECRET);
    const sig = signer.sign(BASE_PARAMS);
    const result = signer.verify({ ...BASE_PARAMS, email: 'attacker@evil.com' }, sig);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid signature');
  });

  // Test 5: verify fails with a tampered approved flag
  it('verify fails with a tampered approved flag', () => {
    const signer = new CallbackSigner(SECRET);
    const sig = signer.sign(BASE_PARAMS);
    const result = signer.verify({ ...BASE_PARAMS, approved: false }, sig);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid signature');
  });

  // Test 6: verify fails with a wrong secret
  it('verify fails with a wrong secret', () => {
    const signer = new CallbackSigner(SECRET);
    const wrongSigner = new CallbackSigner('wrong-secret');
    const sig = wrongSigner.sign(BASE_PARAMS);
    const result = signer.verify(BASE_PARAMS, sig);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid signature');
  });

  // Test 7: verify fails when timestamp is too old (expired)
  it('verify fails when timestamp is too old (expired)', () => {
    const signer = new CallbackSigner(SECRET);
    const oldParams: CallbackParams = {
      ...BASE_PARAMS,
      timestamp: NOW - 301, // 301 seconds ago, beyond default 300s maxAge
    };
    const sig = signer.sign(oldParams);
    const result = signer.verify(oldParams, sig);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Callback expired');
  });

  // Test 8: verify fails when timestamp is in the future (clock skew > maxAge)
  it('verify fails when timestamp is in the future (clock skew > maxAge)', () => {
    const signer = new CallbackSigner(SECRET);
    const futureParams: CallbackParams = {
      ...BASE_PARAMS,
      timestamp: NOW + 301, // 301 seconds in the future
    };
    const sig = signer.sign(futureParams);
    const result = signer.verify(futureParams, sig);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Callback expired');
  });

  // Test 9: buildCallbackUrl produces a valid URL with all params
  it('buildCallbackUrl produces a valid URL with all params', () => {
    const signer = new CallbackSigner(SECRET);
    const urlStr = signer.buildCallbackUrl('https://pds.example.com', BASE_PARAMS);
    const url = new URL(urlStr);

    expect(url.pathname).toBe('/oauth/magic-callback');
    expect(url.searchParams.get('request_uri')).toBe(BASE_PARAMS.requestUri);
    expect(url.searchParams.get('email')).toBe(BASE_PARAMS.email);
    expect(url.searchParams.get('approved')).toBe('true');
    expect(url.searchParams.get('new_account')).toBe('false');
    expect(url.searchParams.get('timestamp')).toBe(String(BASE_PARAMS.timestamp));
    expect(url.searchParams.get('sig')).toMatch(/^[0-9a-f]{64}$/);
  });

  // Test 10: parseCallbackUrl round-trips with buildCallbackUrl
  it('parseCallbackUrl round-trips with buildCallbackUrl', () => {
    const signer = new CallbackSigner(SECRET);
    const urlStr = signer.buildCallbackUrl('https://pds.example.com', BASE_PARAMS);
    const url = new URL(urlStr);
    const { params, signature } = CallbackSigner.parseCallbackUrl(url);

    expect(params.requestUri).toBe(BASE_PARAMS.requestUri);
    expect(params.email).toBe(BASE_PARAMS.email);
    expect(params.approved).toBe(BASE_PARAMS.approved);
    expect(params.newAccount).toBe(BASE_PARAMS.newAccount);
    expect(params.timestamp).toBe(BASE_PARAMS.timestamp);

    // The parsed signature should verify correctly
    const result = signer.verify(params, signature);
    expect(result).toEqual({ valid: true });
  });

  // Test 11: Timing-safe comparison is used
  it('timing-safe comparison is used (crypto.timingSafeEqual is called)', () => {
    const signer = new CallbackSigner(SECRET);
    const sig = signer.sign(BASE_PARAMS);

    const timingSafeEqualSpy = vi.spyOn(crypto, 'timingSafeEqual');
    signer.verify(BASE_PARAMS, sig);
    expect(timingSafeEqualSpy).toHaveBeenCalled();
    timingSafeEqualSpy.mockRestore();
  });
});
