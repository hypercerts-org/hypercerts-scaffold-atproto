# Certified Auth — Frontend & OTP Service Implementation Spec

**Architecture**: Single stock PDS + application-layer OTP service  
**Goal**: Email-first passwordless login across all Certified apps  
**Pattern**: "Sign in with Certified" — same model as "Sign in with Google"  
**Trial app**: Scaffold

---

## Hard Constraints

1. **No PDS fork.** The PDS binary is stock upstream. All passwordless logic lives in the OTP service. ([`holkexyz/atproto`](https://github.com/holkexyz/atproto) exists as a prior experiment — do not build on it.)
2. **Email cannot discover a PDS.** There is no protocol-level mapping from email → PDS. This is why we use a single known PDS (`certified.app`) and call `oauthClient.authorize("https://certified.app")` to skip handle entry entirely.
3. **The PDS only supports password auth.** [PR #4221](https://github.com/bluesky-social/atproto/pull/4221) adds OTP as 2FA but is unmerged. OTP via PDS Gatekeeper exists but is also 2FA on top of passwords, not passwordless. Our OTP service provides the passwordless UX by managing hidden passwords the user never sees.

---

## System Components

### 1. Stock PDS (`certified.app`)

An unmodified ATProto PDS. Already running.

**Relevant configuration**:
- Hostname: `certified.app`
- SMTP: configured via `PDS_EMAIL_SMTP_URL` ([Issue #4194](https://github.com/bluesky-social/atproto/issues/4194)) for the PDS's own email verification
- Granular OAuth scopes: rolling out to self-hosted PDS ([Discussion #4118](https://github.com/bluesky-social/atproto/discussions/4118)) — relevant for limiting what each app can access

**Relevant APIs**:
- `com.atproto.server.createAccount` — takes handle, email, password; returns DID
- `com.atproto.server.createSession` — takes identifier (handle or email) + password; returns access/refresh JWT
- OAuth authorization endpoint at `/oauth/authorize`
- `prompt=create` parameter ([PR #4461](https://github.com/bluesky-social/atproto/pull/4461), [Discussion #4587](https://github.com/bluesky-social/atproto/discussions/4587)) — can differentiate sign-up vs sign-in intent in the OAuth flow

### 2. OTP Service (`auth.certified.app`)

A standalone backend service that wraps the PDS's password auth with passwordless email OTP. Users interact with this service during the OAuth authorization step.

**Responsibilities**:
- Email → account lookup (maintains an `email → DID` mapping)
- OTP generation, email delivery, and validation
- Auto-generated password management (create, store encrypted, use for PDS auth)
- Account creation on first login (calls `com.atproto.server.createAccount`)
- Handle auto-assignment (`{username}.certified.app`, numeric suffix for collisions)

**Data stored**:

| Table | Columns | Notes |
|---|---|---|
| `accounts` | `email` (unique), `did`, `encrypted_password`, `handle`, `created_at` | Core mapping. Consider adding `pds_url` column for future multi-PDS extensibility. |
| `otp_codes` | `email`, `code` (hashed), `expires_at`, `used`, `attempts` | Short-lived, cleaned up on schedule |
| `rate_limits` | `key` (email or IP), `window_start`, `count` | Sliding window or fixed window |

**OTP flow**:

```
User submits email
  → OTP service checks if email exists in its mapping
    → If yes: generate OTP, send to email, prompt for code
    → If no (first time):
        1. Generate random handle ({localpart}.certified.app, deduplicate)
        2. Generate random password (64+ chars, high entropy)
        3. Call com.atproto.server.createAccount on PDS with handle + email + password
        4. Store email → DID mapping and encrypted password
        5. Generate OTP, send to email, prompt for code
  → User submits OTP code
  → OTP service validates code (expiry, single-use, attempt count)
  → OTP service authenticates against PDS using stored password
  → PDS OAuth flow continues (consent screen → token issuance → redirect)
```

**Security requirements**:
- OTP codes: 6 digits, 5-10 minute expiry, single-use, invalidated after 3 failed attempts
- Rate limiting: max 5 OTP requests per email per hour, max 20 per IP per hour
- Passwords: encrypted at rest (AES-256 via AWS KMS or Vault), never logged, never sent to client
- HTTPS only, no sensitive data in query params

**Risk to design around**: If a user changes their email directly on the PDS (bypassing the OTP service), the `email → DID` mapping goes stale. The OTP service should either be the only path for email changes, or handle lookup failures gracefully by falling back to DID-based resolution.

### 3. OAuth Client Integration (per app)

Each Certified app is an OAuth client registered with the PDS. Each app has a BFF (Backend for Frontend) that handles the OAuth token exchange so secrets never touch the browser.

**Per-app setup**:
- Register as OAuth client with PDS → receives `client_id`
- Configure redirect URI (e.g. `https://scaffold.app/callback`)
- BFF handles: Pushed Authorization Request (PAR), PKCE challenge/verifier, DPoP key binding, token exchange, token refresh
- Entry point: `oauthClient.authorize("https://certified.app")` — skips handle entry ([`@atproto/oauth-client-browser` docs](https://www.npmjs.com/package/@atproto/oauth-client-browser))

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                       │
│                                                             │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐     │
│   │   Scaffold   │  │  Future App  │  │  Future App  │     │
│   │   Frontend   │  │   Frontend   │  │   Frontend   │     │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└──────────┼─────────────────┼─────────────────┼──────────────┘
           │                 │                 │
           ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│  Scaffold BFF    │ │ Future App   │ │ Future App   │
│  (OAuth client)  │ │ BFF (OAuth)  │ │ BFF (OAuth)  │
└────────┬─────────┘ └──────┬───────┘ └──────┬───────┘
         │                  │                 │
         │    OAuth (PAR + PKCE + DPoP)       │
         ▼                  ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    certified.app (Stock PDS)                │
│                                                             │
│         OAuth Provider  │  Account Management               │
└────────────────────────────┬────────────────────────────────┘
                             │
                    Login UI delegates to
                             │
                             ▼
                 ┌───────────────────────┐
                 │  OTP Service          │
                 │  (auth.certified.app) │
                 │                       │
                 │  Email → OTP → Verify │
                 │  Hidden password mgmt │
                 │  Account creation     │
                 └───────────────────────┘
```

---

## Auth Flows (End-to-End)

### Flow 1: New user, first time, from Scaffold

1. User visits Scaffold, clicks **"Sign in with Certified"**
2. Scaffold BFF sends **PAR** to `certified.app` with PKCE code challenge and redirect URI
3. Scaffold **redirects user's browser** to `certified.app/oauth/authorize?request_uri=...`
4. PDS authorize page delegates to OTP service
5. User enters **email address**
6. OTP service looks up email — not found → **new account**:
   - Generate handle: `alice.certified.app` (deduplicate if taken)
   - Generate random password (64+ chars)
   - Call `com.atproto.server.createAccount` on PDS
   - Store `email → DID` mapping + encrypted password
7. OTP service generates **6-digit code**, sends to email
8. User enters code
9. OTP service **validates** (expiry, single-use, attempt count)
10. OTP service **authenticates against PDS** using stored password
11. PDS presents **OAuth consent screen** ("Scaffold wants to access your account")
12. User approves
13. PDS **redirects to Scaffold callback** with authorization code
14. Scaffold BFF **exchanges code for DPoP-bound tokens**
15. User is **logged into Scaffold**

### Flow 2: Returning user, from a different Certified app

Same flow, but:
- That app's BFF, `client_id`, and redirect URI
- Step 6: email found → skip account creation
- The app gets its **own independent OAuth token** for the same DID

### Flow 3: Existing ATProto/Bluesky user, from any app

1. User clicks **"Sign in with ATProto/Bluesky"**
2. User enters handle (e.g. `alice.bsky.social`)
3. App resolves handle → DID → PDS URL
4. App BFF sends PAR to user's PDS, redirects user there
5. User authenticates on their own PDS (standard password auth)
6. PDS redirects back with authorization code
7. App BFF exchanges code for tokens
8. User is logged in — no Certified account, no OTP service involved

---

## Frontend UX

### Login Screen (on `certified.app/oauth/authorize`, served by OTP service)

**State 1: Email entry**
- Single input field: "Enter your email"
- Submit button
- No distinction between sign-up and sign-in — the OTP service handles both identically
- Below: link/button for "Sign in with ATProto/Bluesky" (switches to handle entry)

**State 2: OTP entry**
- Text: "We sent a code to alice@example.com"
- 6-digit code input
- "Resend code" link (rate limited)
- "Use a different email" link (returns to State 1)
- Error states: expired code, wrong code, too many attempts

**State 3: OAuth consent** (rendered by the PDS, not the OTP service)
- Shows which app is requesting access and what scopes
- Approve / Deny buttons
- After approve: redirect back to the app

### "Sign in with Certified" Button (on each app)

Each app (starting with Scaffold) shows:
- Primary button: **"Sign in with Certified"** → triggers `oauthClient.authorize("https://certified.app")`
- Secondary/smaller: **"Sign in with ATProto/Bluesky"** → shows handle input, resolves PDS, triggers OAuth against that PDS

---

## Handle Assignment

- Derive from email local part: `alice@example.com` → `alice.certified.app`
- Collision: append numeric suffix → `alice2.certified.app`
- Auto-assigned, changeable later by the user through the PDS
- Invisible in the Certified UX — users never type or see their handle