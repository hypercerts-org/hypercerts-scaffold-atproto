# Hypercerts Scaffold

A Next.js scaffold for building applications on ATProto using the Hypercerts SDK. This project demonstrates authentication, profile management, and hypercert creation on the ATProto network.

## Prerequisites

- Node.js 20+
- Redis instance (for session & state storage), e.g.
  `docker run -d -p 6379:6379 redis:alpine`
- A PDS account for testing

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd hypercerts-scaffold

# Install dependencies
pnpm install

# Copy environment file and configure
cp .env.example .env.local

# Run the development server
pnpm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) to see the application.

> **Note**: If you access `http://localhost:3000`, you'll be automatically redirected to `http://127.0.0.1:3000`. This ensures RFC 8252 compliance for OAuth loopback clients, which requires using IP addresses instead of hostnames for security. See the [Localhost Redirect](#localhost-redirect) section for details.

## Environment Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | Your application's base URL (e.g., `http://127.0.0.1:3000` for local dev, or `https://your-domain.com` for production) |
| `ATPROTO_JWK_PRIVATE` | Private JWK for OAuth authentication (generated using `pnpm run generate-jwk`) |
| `REDIS_HOST` | Redis server hostname |
| `REDIS_PORT` | Redis server port |
| `REDIS_PASSWORD` | Redis password |
| `NEXT_PUBLIC_PDS_URL` | Personal Data Server URL |

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
└───────────┬─────────────────────┬───────────────────┬───────────┘
            │                     │                   │
            ▼                     ▼                   ▼
     ┌───────────┐         ┌───────────┐       ┌───────────┐
     │   Redis   │         │    PDS    │       │    SDS    │
     │ (sessions)│         │ (personal)│       │  (shared) │
     └───────────┘         └───────────┘       └───────────┘
```

### PDS vs SDS

- **PDS (Personal Data Server)**: Stores personal user data - your profile, your personal hypercerts
- **SDS (Shared Data Server)**: Stores organization data - collaborative repositories where multiple users can contribute

The SDK automatically routes requests to the correct server based on the target DID. Since a user can be part of multiple organizations we also have a switch profile button to switch between different organizations.

## Localhost Redirect

This application automatically redirects requests from `localhost` to `127.0.0.1` to ensure RFC 8252 compliance for OAuth loopback clients.

### Why?

[RFC 8252 Section 7.3](https://datatracker.ietf.org/doc/html/rfc8252#section-7.3) requires OAuth loopback clients to use IP addresses (`127.0.0.1`) instead of hostnames (`localhost`) for security reasons:

- **Prevents DNS rebinding attacks**: Using an IP address ensures the redirect stays on the local machine
- **Consistent OAuth behavior**: ATProto PDSs expect IP-based loopback addresses
- **Browser security**: Some browsers handle `localhost` and `127.0.0.1` differently for security features

### How It Works

The application includes a Next.js proxy (`proxy.ts`) that:
1. Detects requests to `localhost:*` (any port)
2. Automatically redirects to `127.0.0.1:*` (preserving port, path, and query params)
3. Uses HTTP 307 (Temporary Redirect) to preserve the request method

**Examples:**
- `http://localhost:3000` → `http://127.0.0.1:3000`
- `http://localhost:3000/login` → `http://127.0.0.1:3000/login`
- `http://localhost:3000/api/auth/callback?code=123` → `http://127.0.0.1:3000/api/auth/callback?code=123`

This is completely transparent to users - just access the app however you prefer, and the redirect will handle the rest!

## Authentication

### How It Works

This scaffold uses OAuth 2.0 with DPoP (Demonstrating Proof of Possession) for authentication, implemented via the Hypercerts SDK.

**Flow:**
1. User enters their handle
2. Application redirects to the ATProto authorization server
3. User approves the application
4. Callback receives the session and stores it in Redis
// Note this will be updated since it is unsafe to restore session using the user-did
5. A `user-did` cookie tracks the authenticated user

### Server-Side Authentication

Use `getRepoContext()` to get an authenticated repository in server components or API routes:

```typescript
import { getRepoContext } from "@/lib/repo-context";

export async function GET() {
  const ctx = await getRepoContext();
  
  if (!ctx) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  
  // ctx.userDid - the authenticated user's DID
  // ctx.activeDid - currently active profile (user or org)
  // ctx.scopedRepo - repository scoped to target DID
  
  const profile = await ctx.scopedRepo.profile.get();
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
  
  // ctx.userDid - the authenticated user's DID
  // ctx.activeDid - currently active profile
  // ctx.scopedRepo - repository scoped to target DID
  
  const profile = await ctx.scopedRepo.profile.get();
  return Response.json(profile);
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

| File | Purpose |
|------|---------|
| `lib/hypercerts-sdk.ts` | SDK initialization and configuration |
| `lib/repo-context.ts` | Helper to get authenticated repository context |
| `lib/create-actions.ts` | Server actions for common operations |

## Learn More

- [ATProto Documentation](https://atproto.com/docs)
- [Hypercerts Documentation](https://hypercerts.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Hypercerts SDK](https://github.com/hypercerts-org/hypercerts-sdk)
