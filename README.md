# Hypercerts Scaffold

A Next.js scaffold for building applications on ATProto using the Hypercerts SDK. This project demonstrates authentication, organization management, and hypercert creation on the ATProto network.

## Prerequisites

- Node.js 18+ 
- Redis instance (for session storage)
- A PDS/SDS account for testing

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd hypercerts-scaffold

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env.local

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your application's base URL (e.g., `http://localhost:3000`) |
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

### Generating the JWK Private Key

The `ATPROTO_JWK_PRIVATE` is a JSON Web Key used for OAuth authentication. Generate one using the `jose` library:

```typescript
import { generateKeyPair, exportJWK } from 'jose';

const { privateKey } = await generateKeyPair('ES256');
const jwk = await exportJWK(privateKey);

// Add required properties
jwk.kid = crypto.randomUUID();
jwk.alg = 'ES256';
jwk.use = 'sig';

console.log(JSON.stringify({ keys: [jwk] }));
```

The resulting JWK should look like this:

```json
{"keys":[{"kty":"EC","x":"...","y":"...","crv":"P-256","d":"...","kid":"...","alg":"ES256","use":"sig"}]}
```

Set this as your `ATPROTO_JWK_PRIVATE` environment variable (wrap in single quotes in `.env.local`).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│         OAuthProvider  │  SessionProvider  │  React Query        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js API Routes                          │
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

The SDK automatically routes requests to the correct server based on the target DID.

## Authentication

### How It Works

This scaffold uses OAuth 2.0 with DPoP (Demonstrating Proof of Possession) for authentication, implemented via the Hypercerts SDK.

**Flow:**
1. User enters their handle
2. Application redirects to the ATProto authorization server
3. User approves the application
4. Callback receives the session and stores it in Redis
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

### Client-Side Authentication

Access authentication state using the OAuth context:

```typescript
import { useOAuthContext } from "@/providers/OAuthProviderSSR";

function MyComponent() {
  const { isSignedIn, isLoading, session } = useOAuthContext();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Please sign in</div>;
  
  return <div>Welcome, {session.did}</div>;
}
```

### Session Provider (Server Components)

For server-rendered pages, use the `SessionProvider`:

```typescript
// In a server component
import { SessionProvider } from "@/providers/SessionProvider";

export default async function Layout({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}

// In a client component
import { useSession } from "@/providers/SessionProvider";

function MyComponent() {
  const { userDid, activeDid, isSignedIn } = useSession();
  // ...
}
```

## Working with Organizations

Organizations are shared repositories on the SDS that allow multiple users to collaborate under a single identity.

### Creating an Organization

```typescript
import { createOrganization } from "@/lib/create-actions";

const org = await createOrganization({
  name: "My Organization",
  handlePrefix: "myorg",  // becomes myorg.sds-domain.com
  description: "Organization description",
});
```

### Adding Collaborators

```typescript
import { addCollaboratorToOrganization } from "@/lib/create-actions";

await addCollaboratorToOrganization({
  repoDid: org.did,
  userDid: "did:plc:abc123...",
  role: "writer",  // "reader" | "writer" | "admin"
});
```

### Switching Profiles

Users can switch between their personal profile and organizations they belong to:

```typescript
import { switchActiveProfile } from "@/lib/create-actions";

// Switch to organization
await switchActiveProfile(org.did);

// Switch back to personal
await switchActiveProfile(userDid);
```

The active profile is stored in the `active-did` cookie. All operations will be performed as the active profile.

### Listing Organizations

```typescript
import { listOrgs } from "@/lib/create-actions";

const result = await listOrgs();
const organizations = result?.organizations || [];
```

## Working with Hypercerts

### Creating a Hypercert

Hypercerts are created via the `/api/certs/create` endpoint:

```typescript
const formData = new FormData();
formData.append("title", "My Hypercert");
formData.append("shortDescription", "A description of the impact");
formData.append("startDate", new Date().toISOString());
formData.append("endDate", new Date().toISOString());
formData.append("rights", JSON.stringify({ name: "CC-BY-4.0", type: "license", description: "..." }));
formData.append("workScope", JSON.stringify({ withinAnyOf: ["climate", "reforestation"] }));

const response = await fetch("/api/certs/create", {
  method: "POST",
  body: formData,
});
```

### Adding Related Records

Hypercerts can have related records attached:

**Evidence** - Supporting documentation
```typescript
await addEvidence({
  hypercertUri: "at://did:plc:.../org.hypercerts.claim.activity/...",
  title: "Audit Report",
  shortDescription: "Third-party verification",
  relationType: "supports",
  evidenceMode: "link",
  evidenceUrl: "https://example.com/report.pdf",
});
```

**Contributions** - Who contributed
```typescript
import { addContribution } from "@/lib/create-actions";

await addContribution({
  hypercertUri: "at://...",
  contributors: ["did:plc:abc...", "did:plc:def..."],
  role: "researcher",
  description: "Conducted field research",
});
```

**Measurements** - Quantifiable metrics
```typescript
import { addMeasurement } from "@/lib/create-actions";

await addMeasurement({
  hypercertUri: "at://...",
  measurers: ["did:plc:..."],
  metric: "trees_planted",
  value: "10000",
});
```

**Evaluations** - Third-party assessments
```typescript
import { addEvaluation } from "@/lib/create-actions";

await addEvaluation({
  hypercertUri: "at://...",
  evaluators: ["did:plc:..."],
  summary: "Impact verified through site visits",
  score: { min: 0, max: 100, value: 85 },
});
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
| `providers/OAuthProviderSSR.tsx` | Client-side OAuth provider |
| `providers/SessionProvider.tsx` | Server-side session context |

## Learn More

- [ATProto Documentation](https://atproto.com/docs)
- [Hypercerts Documentation](https://hypercerts.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
