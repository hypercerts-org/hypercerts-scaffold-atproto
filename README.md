# Hypercerts Scaffold

A Next.js scaffold for building applications on ATProto using the Hypercerts SDK. This project demonstrates authentication, organization management, and hypercert creation on the ATProto network.

## Prerequisites

- Node.js 20+
- Redis instance (for session & state storage), e.g.
  `docker run -d -p 6379:6379 redis:alpine`
- A PDS/SDS account for testing

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

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your application's base URL (e.g., `http://localhost:3000` or ngrok url, eg: `https://<random>.ngrok-free.app`) |
| `ATPROTO_JWK_PRIVATE` | Private JWK for OAuth authentication |
| `REDIS_URL` | Redis connection URL |
| `REDIS_PASSWORD` | Redis password |
| `NEXT_PUBLIC_PDS_URL` | Personal Data Server URL |
| `NEXT_PUBLIC_SDS_URL` | Shared Data Server URL |

### Test Server URLs

For development and testing, use these servers:

```env
NEXT_PUBLIC_PDS_URL=https://pds-eu-west4.test.certified.app
NEXT_PUBLIC_SDS_URL=https://sds-eu-west4.test.certified.app
```

Currently  the loopback client URL does not work so ngrok is required for development purposes.

Once you have the URL from ngrok replace `NEXT_PUBLIC_APP_URL` with ngrok url

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

## Working with Organizations

Organizations are shared repositories on the SDS that allow multiple users to collaborate under a single identity.

```typescript
import { getRepoContext } from "@/lib/repo-context";

export async function GET() {
  const ctx = await getRepoContext({ targetDid: "the_organization_did"});
  
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

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication endpoints
│   │   ├── certs/          # Hypercert operations
│   │   └── profile/        # Profile management
│   ├── hypercerts/         # Hypercert pages
│   ├── organizations/      # Organization pages
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
- [SDS](https://github.com/hypercerts-org/atproto/tree/sds)
