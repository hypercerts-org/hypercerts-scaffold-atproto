# Hypercerts Scaffold

A Next.js scaffold for building applications on ATProto using the Hypercerts SDK. This project demonstrates authentication, profile management, and hypercert creation on the ATProto network.

## Prerequisites

- **Node.js 20+** (we recommend [nvm](https://github.com/nvm-sh/nvm) for version management)
- **pnpm** package manager (`npm install -g pnpm`)
- **Redis** for session & state storage:
  - **Local development:** `docker run -d -p 6379:6379 redis:alpine`
  - **Cloud Redis:** Upstash, Redis Labs, Railway, etc. (see [Environment Configuration](#environment-configuration))
- **A PDS account** for testing (e.g., on https://pds-eu-west4.test.certified.app)

> **Note:** This project uses an unreleased, packed SDK version. See [DEVELOPMENT.md](./DEVELOPMENT.md) for details and important warnings.

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

## ⚠️ Important: SDK Version & Breaking Changes

This scaffold uses an **unreleased, pre-packaged version** of `@hypercerts-org/sdk-core`:

- **Version:** `0.10.0-beta.8` (from `vendor/hypercerts-org-sdk-core-0.10.0-beta.8.tgz`)
- **Source:** Built directly from the [Hypercerts SDK repository](https://github.com/hypercerts-org/hypercerts-sdk) (not from npm)
- **Why:** This allows us to dogfood the latest SDK features before official npm release
- **⚠️ Contains unreleased changes:** Some features may not be merged or may change before the next npm release
- **⚠️ Breaking changes expected:** As the SDK evolves toward 1.0, expect API changes

**Installing the latest SDK version may break this scaffold.** See [DEVELOPMENT.md](./DEVELOPMENT.md) for details on working with the packed SDK, update instructions, and important warnings.

**Issues & Support:** Found a bug or have questions? [Create an issue](https://github.com/hypercerts-org/hypercerts-scaffold-atproto/issues) and [@kzoeps](https://github.com/kzoeps) will respond!

## Environment Configuration

### Required Variables

| Variable               | Description                                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL` | Your application's base URL (e.g., `http://127.0.0.1:3000` for local dev, or `https://your-domain.com` for production) |
| `ATPROTO_JWK_PRIVATE`  | Private JWK for OAuth authentication (generated using `pnpm run generate-jwk`)                                         |
| `REDIS_HOST`           | Redis server hostname                                                                                                  |
| `REDIS_PORT`           | Redis server port                                                                                                      |
| `REDIS_PASSWORD`       | Redis password                                                                                                         |
| `NEXT_PUBLIC_PDS_URL`  | Personal Data Server URL                                                                                               |

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
│                         Client (Browser)                         │
│         OAuthProvider  │  SessionProvider  │  React Query        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│            Next.js API Routes OR Server Actions                 │
│       /api/auth/*  │  /api/certs/*  │  /api/profile/*           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Hypercerts SDK (sdk-core)                    │
│       OAuth Client  │  Session Management  │  Repository Ops     │
└───────────┬─────────────────────┬───────────────────┘
            │                     │
            ▼                     ▼
     ┌───────────┐         ┌───────────┐
     │   Redis   │         │    PDS    │
     │ (sessions)│         │ (personal)│
     └───────────┘         └───────────┘
```

### Personal Data Server (PDS)

The **PDS (Personal Data Server)** stores all user data - your profile and your hypercerts. All operations in this application interact with your personal PDS.

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

### How It Works

This scaffold uses OAuth 2.0 with DPoP (Demonstrating Proof of Possession) for authentication, implemented via the Hypercerts SDK.

**Flow:**

1. User enters their handle (e.g., `user.example.com`)
2. Application redirects to the ATProto authorization server
3. User approves the application
4. OAuth callback receives the authorization code
5. SDK exchanges code for session credentials (stored in Redis)
6. A `user-did` cookie tracks the authenticated user for subsequent requests

### Server-Side Authentication

Use `getRepoContext()` to get an authenticated repository in server components or API routes:

```typescript
import { getRepoContext } from "@/lib/repo-context";

export async function GET() {
  // Get authenticated repository context
  const ctx = await getRepoContext();

  if (!ctx) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Available context properties:
  // ctx.userDid - the authenticated user's DID
  // ctx.activeDid - currently active profile DID
  // ctx.targetDid - the DID this operation targets
  // ctx.repository - repository routed to PDS
  // ctx.scopedRepo - repository scoped to targetDid

  // Use scopedRepo for most operations
  const profile = await ctx.scopedRepo.profile.getCertifiedProfile();
  return Response.json(profile);
}
```

**Simpler alternative** using `getAuthenticatedRepo()`:

```typescript
import { getAuthenticatedRepo } from "@/lib/atproto-session";

export async function GET() {
  const repo = await getAuthenticatedRepo();

  if (!repo) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await repo.profile.getCertifiedProfile();
  return Response.json(profile);
}
```

## Working with Repository Context

The repository context provides access to the authenticated user's repository and profile data.

```typescript
import { getRepoContext } from "@/lib/repo-context";

export async function GET() {
  const ctx = await getRepoContext();

  if (!ctx) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Access user profile
  const profile = await ctx.scopedRepo.profile.getCertifiedProfile();

  // Create a hypercert
  await ctx.scopedRepo.hypercert.create({
    title: "My Hypercert",
    description: "A certificate of impact",
    // ... other fields
  });

  // List hypercerts
  const hypercerts = await ctx.scopedRepo.hypercert.list();

  return Response.json({ profile, hypercerts });
}
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication endpoints
│   │   ├── certs/          # Hypercert operations
│   │   └── profile/        # Profile management
│   ├── hypercerts/         # Hypercert pages
│   └── profile/            # Profile page
├── components/             # React components
├── lib/
│   ├── api/                # Centralized API client
│   ├── create-actions.ts   # Server actions
│   ├── hypercerts-sdk.ts   # SDK initialization
│   ├── repo-context.ts     # Repository context helper
│   └── ...
├── providers/              # React context providers
├── queries/                # TanStack Query hooks
└── lexicons/               # ATProto lexicon definitions
```

### Key Files

| File                    | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `lib/hypercerts-sdk.ts` | SDK initialization and configuration           |
| `lib/repo-context.ts`   | Helper to get authenticated repository context |
| `lib/create-actions.ts` | Server actions for common operations           |

## Learn More

### Scaffold Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide, SDK version details, contributing guidelines

### External Documentation

- [ATProto Documentation](https://atproto.com/docs)
- [Hypercerts Documentation](https://hypercerts.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Hypercerts SDK](https://github.com/hypercerts-org/hypercerts-sdk)

### This Project

- [Report Issues](https://github.com/hypercerts-org/hypercerts-scaffold-atproto/issues)
- Maintainer: [@kzoeps](https://github.com/kzoeps)
