[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/hypercerts-org/hypercerts-scaffold-atproto)

# Hypercerts Scaffold

A Next.js scaffold for building applications on ATProto using native ATProto. This project demonstrates authentication, profile management, and hypercert creation on the ATProto network.

## Prerequisites

- **Node.js 20+** (we recommend [nvm](https://github.com/nvm-sh/nvm) for version management)
- **pnpm** package manager (`npm install -g pnpm`)
- **Redis** for session & state storage:
  - **Local development:** `docker run -d -p 6379:6379 redis:alpine`
  - **Cloud Redis:** Upstash, Redis Labs, Railway, etc. (see [Environment Configuration](#environment-configuration))
- **A PDS account** for testing (e.g., on https://pds-eu-west4.test.certified.app)

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd hypercerts-scaffold

# Install dependencies (we use pnpm for this project)
pnpm install

# Copy environment file and configure
cp .env.example .env.local

# Make sure Redis is running (if using Docker)
docker ps  # should show a Redis container running

# Generate and display the key
pnpm run generate-jwk

# Or append directly to .env.local
pnpm run --silent generate-jwk >> .env.local

# Run the development server
pnpm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) to see the application.

> **⚠️ OAuth Requirement**: You **must** use `http://127.0.0.1:3000` for local development (not `localhost`).  
> The app automatically redirects `localhost` to `127.0.0.1` for RFC 8252 OAuth compliance.  
> See [Localhost Redirect](#localhost-redirect) for details.

## Architecture Note

This scaffold uses **native ATProto** — all record operations go through `@atproto/api` directly, with `@hypercerts-org/lexicon` for type definitions and record validation. There is no SDK wrapper layer.

**Issues & Support:** Found a bug or have questions? [Create an issue](https://github.com/hypercerts-org/hypercerts-scaffold-atproto/issues) and [@kzoeps](https://github.com/kzoeps) will respond!

## Environment Configuration

### Required Variables

| Variable               | Description                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL` | App base URL. Use `http://127.0.0.1:3000` for local dev. Falls back to `VERCEL_URL` on Vercel. |
| `ATPROTO_JWK_PRIVATE`  | Private JWK (JWKS format) for OAuth client assertion. Generate with `pnpm run generate-jwk`.   |
| `REDIS_HOST`           | Redis server hostname (e.g., `localhost` for Docker, or cloud Redis host)                      |
| `REDIS_PORT`           | Redis server port (default: `6379`)                                                            |
| `REDIS_PASSWORD`       | Redis password. Leave empty for local Docker (no auth).                                        |
| `NEXT_PUBLIC_PDS_URL`  | Personal Data Server URL (e.g., `https://pds-eu-west4.test.certified.app`)                     |

### Optional Variables

| Variable                       | Description                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_EPDS_URL`         | ePDS URL for email-based login. When set, enables the Email login tab in the UI. Example: `https://epds1.test.certified.app`                                 |
| `NEXT_PUBLIC_EPDS_HANDLE_MODE` | ePDS handle creation mode. Valid values: `random`, `picker`, `picker-with-random` (default). Only used when `NEXT_PUBLIC_EPDS_URL` is set.                   |
| `OAUTH_SESSION_SECRET`         | Server-only HMAC secret for ePDS OAuth session cookie. Required when `NEXT_PUBLIC_EPDS_URL` is set. Must be 32+ chars. Generate with: `openssl rand -hex 32` |
| `REDIS_USERNAME`               | Redis username. Defaults to `default` when `REDIS_PASSWORD` is set.                                                                                          |
| `NEXT_PUBLIC_HANDLE_RESOLVER`  | Handle resolver URL. Defaults to `https://bsky.social`.                                                                                                      |

### Local Development

For local development, you **must** use `127.0.0.1` instead of `localhost`:

```env
NEXT_PUBLIC_BASE_URL=http://127.0.0.1:3000
```

This is required for [RFC 8252](https://datatracker.ietf.org/doc/html/rfc8252#section-7.3) compliance. The application includes automatic redirect handling - if you access `http://localhost:3000`, you'll be redirected to `http://127.0.0.1:3000`.

### Test Server URLs

For development and testing, use these servers:

```env
NEXT_PUBLIC_PDS_URL=https://pds-eu-west4.test.certified.app
# Optional: Enable email login via ePDS
NEXT_PUBLIC_EPDS_URL=https://epds1.test.certified.app
```

### Testing with ngrok

If you need to test with external services (webhooks, mobile apps, etc.), use ngrok:

```bash
# Start ngrok
ngrok http 3000

# Update .env.local with your ngrok URL
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
```

### Generating the JWK Private Key

The `ATPROTO_JWK_PRIVATE` is a JSON Web Key used for OAuth authentication. Generate one using the included script:

```bash
# Install dependencies first
pnpm install

# Generate and display the key
pnpm run generate-jwk

# Or append directly to .env.local
pnpm run --silent generate-jwk >> .env.local
```

The script outputs the complete environment variable line. You can either copy it manually or append directly to your `.env.local` file using `>>`.

⚠️ **Important**: Keep this key secure and never commit it to git!

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Client (Browser)                          │
│   Login Dialog (Handle │ Email)  │  React Query  │  Forms       │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
    ┌──────────▼──────────┐    ┌──────────▼──────────┐
    │  /api/oauth/*       │    │  /api/oauth/epds/*   │
    │  (Standard ATProto) │    │  (ePDS Email Login)  │
    │  NodeOAuthClient    │    │  Manual DPoP + PKCE  │
    └──────────┬──────────┘    └──────────┬───────────┘
               │                          │
               ▼                          ▼
    ┌─────────────────────────────────────────────────┐
    │         Native ATProto (Agent from @atproto/api) │
    │  Session Restore  │  @hypercerts-org/lexicon     │
    │  Validation       │  CRUD (getRecord, putRecord) │
    └──────────┬──────────────────────┬───────────────┘
               │                      │
        ┌──────▼──────┐        ┌──────▼──────────┐
        │    Redis    │        │   PDS / ePDS    │
        │  Sessions   │        │  XRPC calls:    │
        │ OAuth State │        │  getRecord      │
        └─────────────┘        │  createRecord   │
                               │  putRecord      │
                               │  deleteRecord   │
                               │  uploadBlob     │
                               └─────────────────┘
```

Also served: `/client-metadata.json` and `/jwks.json` (OAuth metadata endpoints, no auth required).

### Personal Data Server (PDS)

- **PDS (Personal Data Server)** stores user data (profiles, hypercerts). Standard ATProto login authenticates against the user's PDS using handle-based OAuth managed by NodeOAuthClient.
- **ePDS (Email PDS)** is a Certified Auth PDS that supports email-based login with OTP verification. It serves the same role as a standard PDS but uses an email address instead of a handle for authentication. The ePDS flow is enabled when `NEXT_PUBLIC_EPDS_URL` is set.

## Localhost Redirect

**TL;DR**: Use `http://127.0.0.1:3000` for local development. The app automatically redirects `localhost` → `127.0.0.1`, but your `.env.local` **must** use `127.0.0.1` for OAuth to work.

This application automatically redirects requests from `localhost` to `127.0.0.1` to ensure RFC 8252 compliance for OAuth loopback clients.

### Why?

[RFC 8252 Section 7.3](https://datatracker.ietf.org/doc/html/rfc8252#section-7.3) requires OAuth loopback clients to use IP addresses (`127.0.0.1`) instead of hostnames (`localhost`) for security reasons:

- **Prevents DNS rebinding attacks**: Using an IP address ensures the redirect stays on the local machine
- **Consistent OAuth behavior**: ATProto PDSs expect IP-based loopback addresses
- **Browser security**: Some browsers handle `localhost` and `127.0.0.1` differently for security features

### Troubleshooting OAuth Issues

**Problem:** "OAuth callback failed" or "Invalid redirect_uri"

**Solution:**

- Check that `NEXT_PUBLIC_BASE_URL` in `.env.local` uses `127.0.0.1` (not `localhost`)
- Restart the dev server after changing `.env.local`
- Clear browser cookies and try again

**Problem:** Redirect loop after login

**Solution:**

- Clear browser cookies
- Restart the dev server
- Try in incognito/private browsing mode
- Check that Redis is running (`docker ps`)

**Problem:** Works on `127.0.0.1` but not with ngrok

**Solution:**

- Update `NEXT_PUBLIC_BASE_URL` to your ngrok URL (e.g., `https://abc123.ngrok.io`)
- Restart the dev server after changing the URL
- Note: ngrok URLs change on each restart unless you have a paid plan with reserved domains

## Authentication

### Flow 1: Handle Login (Standard ATProto)

This scaffold uses OAuth 2.0 with DPoP (Demonstrating Proof of Possession) for authentication, implemented via @atproto/oauth-client-node.

**Flow:**

1. User enters their handle (e.g., `user.example.com`)
2. Application redirects to the ATProto authorization server
3. User approves the application
4. OAuth callback receives the authorization code
5. NodeOAuthClient exchanges code for session credentials (stored in Redis)
6. A `user-did` cookie tracks the authenticated user for subsequent requests

### Flow 2: Email Login (ePDS)

> Requires `NEXT_PUBLIC_EPDS_URL` to be set. When configured, an Email tab appears in the login dialog.

1. User enters their email address (or leaves it blank for the ePDS to collect it)
2. App sends a Pushed Authorization Request (PAR) to the ePDS with a PKCE challenge and DPoP proof
3. App stores OAuth state (code verifier + DPoP private key) in Redis
4. User is redirected to the ePDS authorization page
5. ePDS sends a one-time password (OTP) to the user's email
6. User enters the OTP code on the ePDS page
7. ePDS redirects back to `/api/oauth/epds/callback` with an authorization code
8. App exchanges the code for tokens using DPoP, creates a session in Redis
9. User is authenticated — same `user-did` cookie as the standard flow

**Key technical details:**

- DPoP (Demonstrating Proof-of-Possession) uses EC P-256 keys to bind tokens to the client
- PKCE with S256 challenge method prevents authorization code interception
- OAuth state is stored in Redis (not cookies) to avoid cross-site redirect issues
- The ePDS flow supports custom branding (logo, colors) and a custom email template for OTP codes

### How the Login UI Works

- When only `NEXT_PUBLIC_PDS_URL` is set: the login dialog shows only the Handle tab
- When `NEXT_PUBLIC_EPDS_URL` is also set: the login dialog shows a pill toggle with Handle and Email tabs
- Both flows result in the same session format — downstream code is agnostic to the login method

### Server-Side Authentication

Use `getRepoContext()` to get an authenticated agent in server components or API routes:

```typescript
import { getRepoContext } from "@/lib/repo-context";

export async function GET() {
  const ctx = await getRepoContext();
  if (!ctx) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  // ctx.userDid - the authenticated user's DID
  // ctx.activeDid - currently active profile DID
  // ctx.targetDid - the DID this operation targets
  // ctx.agent - Agent instance bound to the OAuth session

  // Use agent for direct ATProto calls
  const result = await ctx.agent.com.atproto.repo.getRecord({
    repo: ctx.activeDid,
    collection: "app.certified.actor.profile",
    rkey: "self",
  });
  return Response.json(result.data.value);
}
```

**Alternative** using `getAgent()`:

```typescript
import { getAgent } from "@/lib/atproto-session";

export async function GET() {
  const agent = await getAgent();
  if (!agent) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  // agent is an @atproto/api Agent bound to the OAuth session
}
```

## Working with Repository Context

The repository context provides access to the authenticated user's agent and DID information.

```typescript
import { getRepoContext } from "@/lib/repo-context";

export async function GET() {
  const ctx = await getRepoContext();

  if (!ctx) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Access user profile
  const profile = await ctx.agent.com.atproto.repo.getRecord({
    repo: ctx.activeDid,
    collection: "app.certified.actor.profile",
    rkey: "self",
  });

  // Create a hypercert
  await ctx.agent.com.atproto.repo.createRecord({
    repo: ctx.activeDid,
    collection: "app.certified.hypercert",
    record: {
      title: "My Hypercert",
      description: "A certificate of impact",
      // ... other fields
    },
  });

  // List hypercerts
  const hypercerts = await ctx.agent.com.atproto.repo.listRecords({
    repo: ctx.activeDid,
    collection: "app.certified.hypercert",
  });

  return Response.json({
    profile: profile.data.value,
    hypercerts: hypercerts.data.records,
  });
}
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── oauth/             # ATProto OAuth (login, callback, logout)
│   │   │   └── epds/          # ePDS email OAuth (login, callback)
│   │   ├── certs/             # Hypercert operations (create, add-attachment, add-location)
│   │   └── profile/           # Profile management (certified + bluesky)
│   ├── client-metadata.json/  # OAuth client metadata endpoint
│   ├── jwks.json/             # Public JWKS endpoint
│   ├── hypercerts/            # Hypercert pages (list, create, [detail])
│   ├── profile/               # Certified profile page
│   └── bsky-profile/          # Bluesky profile page
├── components/                # React components (login dialog, forms, detail views)
│   └── ui/                    # shadcn/ui primitives (button, dialog, input, etc.)
├── lib/
│   ├── api/                   # Client-side API functions and types
│   ├── config.ts              # Centralized app configuration
│   ├── hypercerts-sdk.ts      # OAuth client initialization (NodeOAuthClient)
│   ├── redis.ts               # Redis client setup
│   ├── redis-state-store.ts   # Redis stores (sessions, OAuth state, ePDS state)
│   ├── atproto-session.ts     # Server-side session helpers
│   ├── atproto-writes.ts      # Shared write utilities (StrongRef resolution, location creation, blob upload)
│   ├── record-validation.ts   # Generic lexicon record validation assertion
│   ├── repo-context.ts        # Helper to get authenticated Agent + DID context
│   ├── types.ts               # TypeScript types, Collections enum, type guards
│   ├── blob-utils.ts          # Blob reference to URL resolution for rendering
│   ├── create-actions.ts      # Server actions for CRUD operations
│   ├── epds-config.ts         # ePDS OAuth endpoint configuration
│   ├── epds-helpers.ts        # ePDS PKCE + DPoP utilities
│   └── atproto-branding.ts    # OAuth page branding (CSS, logos)
├── providers/                 # React providers (QueryClient, auth gating)
├── queries/                   # TanStack Query hooks (auth, hypercerts, profile)
├── public/                    # Static assets (logos, email template)
└── scripts/                   # Utility scripts (JWK generation)
```

### Key Files

| File                                | Purpose                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `lib/config.ts`                     | Centralized configuration — base URLs, OAuth client IDs, redirect URIs, scopes |
| `lib/hypercerts-sdk.ts`             | OAuth client initialization with NodeOAuthClient, Redis stores                 |
| `lib/redis-state-store.ts`          | Three Redis-backed stores: sessions, standard OAuth state, ePDS OAuth state    |
| `lib/repo-context.ts`               | Helper to get authenticated Agent + DID context                                |
| `lib/atproto-writes.ts`             | Shared write utilities (StrongRef resolution, location creation, blob upload)  |
| `lib/record-validation.ts`          | Generic lexicon record validation assertion                                    |
| `lib/types.ts`                      | TypeScript types, Collections enum, type guards                                |
| `lib/blob-utils.ts`                 | Blob reference to URL resolution for rendering                                 |
| `lib/epds-config.ts`                | Derives ePDS OAuth endpoints (PAR, auth, token) from `NEXT_PUBLIC_EPDS_URL`    |
| `lib/epds-helpers.ts`               | PKCE code verifier/challenge, DPoP key generation and proof creation           |
| `components/login-dialog.tsx`       | Dual-mode login UI with Handle/Email pill toggle                               |
| `app/client-metadata.json/route.ts` | OAuth client metadata (RFC 7591) — serves client_id, redirect_uris, branding   |

## Learn More

### Scaffold Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide, contributing guidelines

### External Documentation

- [ATProto Documentation](https://atproto.com/docs)
- [Hypercerts Documentation](https://hypercerts.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### This Project

- [Report Issues](https://github.com/hypercerts-org/hypercerts-scaffold-atproto/issues)
- Maintainer: [@kzoeps](https://github.com/kzoeps)
