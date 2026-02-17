import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import http from 'http';
import { createDatabase, OTPService, RateLimiter, CallbackSigner } from '@certified/shared';
import type { Mailer } from '@certified/shared';
import { createApp } from './app.js';

// Helper to make HTTP requests to the test server
function makeRequest(
  server: http.Server,
  opts: {
    method: string;
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
    cookies?: string;
  }
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as { port: number };
    const bodyStr = opts.body ? JSON.stringify(opts.body) : undefined;
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...opts.headers,
    };
    if (opts.cookies) {
      reqHeaders['Cookie'] = opts.cookies;
    }
    if (bodyStr) {
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: addr.port,
        path: opts.path,
        method: opts.method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, headers: res.headers, body: data });
        });
      }
    );
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function parseCookies(headers: http.IncomingHttpHeaders): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookie = headers['set-cookie'];
  if (!setCookie) return cookies;
  for (const cookie of setCookie) {
    const [pair] = cookie.split(';');
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const name = pair.slice(0, eqIdx).trim();
    const value = pair.slice(eqIdx + 1).trim();
    cookies[name] = value;
  }
  return cookies;
}

function buildCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function createTestApp() {
  const db = createDatabase(':memory:');
  const otpService = new OTPService(db);
  const rateLimiter = new RateLimiter(db);
  const callbackSigner = new CallbackSigner('test-secret');

  // Mock mailer
  const sentEmails: Array<{ to: string; code: string }> = [];
  const mailer = {
    sendOTP: vi.fn(async (to: string, code: string) => {
      sentEmails.push({ to, code });
    }),
    verifyConnection: vi.fn(async () => true),
  } as unknown as Mailer;

  const app = createApp({
    otpService,
    mailer,
    rateLimiter,
    callbackSigner,
    db,
    sessionSecret: 'test-session-secret',
    pdsUrl: 'http://pds.example.com',
  });

  return { app, db, otpService, rateLimiter, callbackSigner, mailer, sentEmails };
}

describe('Auth Service Integration Tests', () => {
  let server: http.Server;
  let testCtx: ReturnType<typeof createTestApp>;

  beforeEach(async () => {
    testCtx = createTestApp();
    server = http.createServer(testCtx.app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  });

  // Helper to close server after each test
  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  // ─── Security headers ────────────────────────────────────────────────────────

  it('9. Security headers are present on all responses', async () => {
    const res = await makeRequest(server, { method: 'GET', path: '/health' });
    expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });

  // ─── GET /oauth/authorize ────────────────────────────────────────────────────

  it('1. GET /oauth/authorize with request_uri renders email input page', async () => {
    const res = await makeRequest(server, {
      method: 'GET',
      path: '/oauth/authorize?request_uri=urn:ietf:params:oauth:request_uri:test123&client_id=test-client',
      headers: { Accept: 'text/html' },
    });
    expect(res.status).toBe(200);
    expect(res.body).toContain('Sign in');
    expect(res.body).toContain('email');
    // Should set session cookie
    const cookies = parseCookies(res.headers);
    expect(cookies['auth-session']).toBeTruthy();
    // Should set CSRF cookie
    expect(cookies['csrf-token']).toBeTruthy();
  });

  it('GET /oauth/authorize without request_uri returns 400', async () => {
    const res = await makeRequest(server, {
      method: 'GET',
      path: '/oauth/authorize',
      headers: { Accept: 'text/html' },
    });
    expect(res.status).toBe(400);
  });

  it('2. GET /oauth/authorize with login_hint auto-sends OTP and renders OTP page', async () => {
    const res = await makeRequest(server, {
      method: 'GET',
      path: '/oauth/authorize?request_uri=urn:test&client_id=test&login_hint=user@example.com',
      headers: { Accept: 'text/html' },
    });
    expect(res.status).toBe(200);
    expect(res.body).toContain('Check your email');
    expect(res.body).toContain('u***@example.com');
    // OTP should have been sent
    expect(testCtx.sentEmails).toHaveLength(1);
    expect(testCtx.sentEmails[0].to).toBe('user@example.com');
  });

  // ─── POST /auth/send-code ────────────────────────────────────────────────────

  it('3. POST /auth/send-code sends OTP and redirects to verification page', async () => {
    // First get CSRF token
    const getRes = await makeRequest(server, {
      method: 'GET',
      path: '/oauth/authorize?request_uri=urn:test&client_id=test',
    });
    const cookies = parseCookies(getRes.headers);
    const csrfToken = cookies['csrf-token'];

    const postRes = await makeRequest(server, {
      method: 'POST',
      path: '/auth/send-code',
      body: { email: 'test@example.com' },
      headers: { 'x-csrf-token': csrfToken },
      cookies: buildCookieHeader(cookies),
    });

    expect(postRes.status).toBe(200);
    const data = JSON.parse(postRes.body);
    expect(data.success).toBe(true);
    expect(data.redirect).toContain('/auth/verify');
    expect(testCtx.sentEmails.length).toBeGreaterThan(0);
  });

  it('4. POST /auth/send-code returns success even for unknown emails (anti-enumeration)', async () => {
    const getRes = await makeRequest(server, {
      method: 'GET',
      path: '/oauth/authorize?request_uri=urn:test&client_id=test',
    });
    const cookies = parseCookies(getRes.headers);
    const csrfToken = cookies['csrf-token'];

    // Even if mailer fails, should still return success
    (testCtx.mailer.sendOTP as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('SMTP error'));

    const postRes = await makeRequest(server, {
      method: 'POST',
      path: '/auth/send-code',
      body: { email: 'unknown@example.com' },
      headers: { 'x-csrf-token': csrfToken },
      cookies: buildCookieHeader(cookies),
    });

    expect(postRes.status).toBe(200);
    const data = JSON.parse(postRes.body);
    expect(data.success).toBe(true);
  });

  // ─── POST /auth/verify-code ──────────────────────────────────────────────────

  it('5. POST /auth/verify-code with correct code redirects to PDS callback with HMAC signature', async () => {
    // Setup: get CSRF, send code
    const getRes = await makeRequest(server, {
      method: 'GET',
      path: '/oauth/authorize?request_uri=urn:test-req&client_id=test',
    });
    let cookies = parseCookies(getRes.headers);
    const csrfToken = cookies['csrf-token'];

    const sendRes = await makeRequest(server, {
      method: 'POST',
      path: '/auth/send-code',
      body: { email: 'verify@example.com' },
      headers: { 'x-csrf-token': csrfToken },
      cookies: buildCookieHeader(cookies),
    });

    // Merge cookies from send-code response
    const sendCookies = parseCookies(sendRes.headers);
    cookies = { ...cookies, ...sendCookies };

    // Get the actual OTP code from the sent emails
    const sentEmail = testCtx.sentEmails.find((e) => e.to === 'verify@example.com');
    expect(sentEmail).toBeTruthy();
    const code = sentEmail!.code;

    const verifyRes = await makeRequest(server, {
      method: 'POST',
      path: '/auth/verify-code',
      body: { code },
      headers: { 'x-csrf-token': csrfToken },
      cookies: buildCookieHeader(cookies),
    });

    expect(verifyRes.status).toBe(200);
    const data = JSON.parse(verifyRes.body);
    expect(data.success).toBe(true);
    expect(data.redirect).toContain('pds.example.com');
    expect(data.redirect).toContain('sig=');
    expect(data.redirect).toContain('approved=true');
  });

  it('6. POST /auth/verify-code with wrong code re-renders OTP page with error', async () => {
    const getRes = await makeRequest(server, {
      method: 'GET',
      path: '/oauth/authorize?request_uri=urn:test&client_id=test',
    });
    let cookies = parseCookies(getRes.headers);
    const csrfToken = cookies['csrf-token'];

    const sendRes = await makeRequest(server, {
      method: 'POST',
      path: '/auth/send-code',
      body: { email: 'wrong@example.com' },
      headers: { 'x-csrf-token': csrfToken },
      cookies: buildCookieHeader(cookies),
    });
    const sendCookies = parseCookies(sendRes.headers);
    cookies = { ...cookies, ...sendCookies };

    const verifyRes = await makeRequest(server, {
      method: 'POST',
      path: '/auth/verify-code',
      body: { code: '00000000' }, // wrong code
      headers: { 'x-csrf-token': csrfToken },
      cookies: buildCookieHeader(cookies),
    });

    expect(verifyRes.status).toBe(200);
    const data = JSON.parse(verifyRes.body);
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
    expect(data.html).toContain('Check your email');
  });

  // ─── CSRF protection ─────────────────────────────────────────────────────────

  it('7. CSRF protection rejects POST requests without valid token', async () => {
    const res = await makeRequest(server, {
      method: 'POST',
      path: '/auth/send-code',
      body: { email: 'test@example.com' },
      // No CSRF token
    });
    expect(res.status).toBe(403);
  });

  it('7b. CSRF protection rejects POST requests with mismatched token', async () => {
    const getRes = await makeRequest(server, {
      method: 'GET',
      path: '/oauth/authorize?request_uri=urn:test&client_id=test',
    });
    const cookies = parseCookies(getRes.headers);

    const res = await makeRequest(server, {
      method: 'POST',
      path: '/auth/send-code',
      body: { email: 'test@example.com' },
      headers: { 'x-csrf-token': 'wrong-token' },
      cookies: buildCookieHeader(cookies),
    });
    expect(res.status).toBe(403);
  });

  // ─── Rate limiting ───────────────────────────────────────────────────────────

  it('8. Rate limiting returns 429 when limits exceeded', async () => {
    const getRes = await makeRequest(server, {
      method: 'GET',
      path: '/oauth/authorize?request_uri=urn:test&client_id=test',
    });
    const cookies = parseCookies(getRes.headers);
    const csrfToken = cookies['csrf-token'];

    // Send 3 requests (burst limit is 3 per 15 min)
    for (let i = 0; i < 3; i++) {
      await makeRequest(server, {
        method: 'POST',
        path: '/auth/send-code',
        body: { email: 'ratelimit@example.com' },
        headers: { 'x-csrf-token': csrfToken },
        cookies: buildCookieHeader(cookies),
      });
    }

    // 4th request should be rate limited
    const res = await makeRequest(server, {
      method: 'POST',
      path: '/auth/send-code',
      body: { email: 'ratelimit@example.com' },
      headers: { 'x-csrf-token': csrfToken },
      cookies: buildCookieHeader(cookies),
    });

    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeTruthy();
  });

  // ─── Session state ───────────────────────────────────────────────────────────

  it('10. Session state survives across authorize → send-code → verify-code flow', async () => {
    // Step 1: authorize
    const authRes = await makeRequest(server, {
      method: 'GET',
      path: '/oauth/authorize?request_uri=urn:session-test&client_id=my-client',
    });
    expect(authRes.status).toBe(200);
    let cookies = parseCookies(authRes.headers);
    expect(cookies['auth-session']).toBeTruthy();
    const csrfToken = cookies['csrf-token'];

    // Step 2: send-code
    const sendRes = await makeRequest(server, {
      method: 'POST',
      path: '/auth/send-code',
      body: { email: 'session@example.com' },
      headers: { 'x-csrf-token': csrfToken },
      cookies: buildCookieHeader(cookies),
    });
    expect(sendRes.status).toBe(200);
    const sendCookies = parseCookies(sendRes.headers);
    cookies = { ...cookies, ...sendCookies };
    // Session should still be present
    expect(cookies['auth-session']).toBeTruthy();

    // Step 3: verify-code
    const sentEmail = testCtx.sentEmails.find((e) => e.to === 'session@example.com');
    expect(sentEmail).toBeTruthy();

    const verifyRes = await makeRequest(server, {
      method: 'POST',
      path: '/auth/verify-code',
      body: { code: sentEmail!.code },
      headers: { 'x-csrf-token': csrfToken },
      cookies: buildCookieHeader(cookies),
    });

    expect(verifyRes.status).toBe(200);
    const data = JSON.parse(verifyRes.body);
    expect(data.success).toBe(true);
    // Callback URL should contain the original request_uri from session
    expect(data.redirect).toContain('urn%3Asession-test');
  });
});
