# Development Guide

## Architecture Overview

This scaffold uses **native ATProto** for all record operations:

- **`@atproto/api`** — `Agent` class for XRPC calls (`getRecord`, `createRecord`, `putRecord`, `deleteRecord`, `uploadBlob`)
- **`@atproto/oauth-client-node`** — `NodeOAuthClient` for OAuth session management
- **`@hypercerts-org/lexicon`** — TypeScript types and `validateRecord` functions for all Hypercerts collections

There is no SDK wrapper layer. The lexicon package is installed from the npm registry.

---

## Lexicon Package

The `@hypercerts-org/lexicon` package provides TypeScript types and `validateRecord` functions for Hypercerts collections. It is installed from the npm registry via `package.json`.

---

## Updating the Lexicon Package

The lexicon package provides TypeScript types and record validators. To update:

1. Update `@hypercerts-org/lexicon` in `package.json` to the desired version
2. Run `pnpm install`
3. Check for type errors: `npx tsc --noEmit`

If types have changed, update code in `lib/types.ts`, `lib/create-actions.ts`, and `lib/queries.ts` to match.

---

## Local Development Workflow

### Prerequisites

- **Node.js 20+** (we recommend [nvm](https://github.com/nvm-sh/nvm) for version management)
- **pnpm** package manager: `npm install -g pnpm`
- **Docker** (for Redis) OR a cloud Redis instance
- **A PDS account** for testing (e.g., on https://pds-eu-west4.test.certified.app)

### First-time Setup

#### 1. Clone and install

```bash
git clone https://github.com/hypercerts-org/hypercerts-scaffold-atproto
cd hypercerts-scaffold-atproto
pnpm install
```

#### 2. Start Redis

**Option A - Docker (recommended for local development):**

```bash
docker run -d -p 6379:6379 --name hypercerts-redis redis:alpine
```

**Option B - Cloud Redis:**

Use a service like Upstash, Redis Labs, Railway, etc. You'll need the connection details for `.env.local`.

#### 3. Configure environment

```bash
# Copy the example environment file
cp .env.example .env.local

# Generate a JWK private key and append to .env.local
pnpm run generate-jwk >> .env.local
```

Edit `.env.local` and configure:

```bash
# MUST use 127.0.0.1 for OAuth to work
NEXT_PUBLIC_BASE_URL=http://127.0.0.1:3000

# If using cloud Redis, update these:
REDIS_HOST=your-redis-host.com
REDIS_PORT=12345
REDIS_PASSWORD=your_password

# PDS server URL
NEXT_PUBLIC_PDS_URL=https://pds-eu-west4.test.certified.app

# If enabling ePDS email login, also set:
OAUTH_SESSION_SECRET=<paste the output from the command below>
```

To generate a session secret, run this command separately in your terminal and paste the output above:

```bash
# Generate a session secret (required for ePDS email login)
openssl rand -hex 32
```

**Important:**

- `NEXT_PUBLIC_BASE_URL` **must** use `127.0.0.1` (not `localhost`) for OAuth to work
- Never commit `.env.local` to git - it contains secrets!

#### 4. Run the dev server

```bash
pnpm run dev
```

#### 5. Open the application

Navigate to http://127.0.0.1:3000 (note: must use `127.0.0.1`, not `localhost`!)

You should see the scaffold homepage. Try logging in with your PDS account.

### Daily Development

```bash
# Make sure Redis is running (if using Docker)
docker start hypercerts-redis

# Start the dev server
pnpm run dev

# In another terminal, run linting (optional)
pnpm run lint
```

### Test Environment

If running Playwright tests, copy `tests/.env.test.example` to `tests/.env.test` and fill in test credentials. See the example file for details.

### Common Development Tasks

**Check types:**

```bash
npx tsc --noEmit
```

**Run linter:**

```bash
pnpm run lint
```

**Build for production:**

```bash
pnpm run build
```

**Start production server:**

```bash
pnpm run start
```

### Code Formatting

This project uses Prettier for formatting and ESLint for linting, enforced via pre-commit hooks.

**Format all files:**

```bash
pnpm run format
```

**Check formatting without writing:**

```bash
pnpm run format:check
```

**Pre-commit hooks (automatic):**
A `lint-staged` hook runs automatically on every commit via Husky:

- Prettier formats staged `.ts`, `.tsx`, and `.mjs` files
- ESLint fixes staged `.ts` and `.tsx` files

You don't need to run these manually — they run on `git commit`.

---

## Common Issues & Troubleshooting

### Redis Connection Errors

**Symptom:** Error connecting to Redis, session storage fails

**Solutions:**

- Check Redis is running: `docker ps` (should see hypercerts-redis)
- Start Redis if stopped: `docker start hypercerts-redis`
- Check `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` in `.env.local`
- Test Redis connection: `redis-cli ping` (should return `PONG`)

### OAuth/Authentication Errors

**Symptom:** "Invalid redirect_uri" or OAuth callback fails

**Solutions:**

- **Must use `127.0.0.1`, not `localhost`** - OAuth requires IP addresses for loopback
- Check `NEXT_PUBLIC_BASE_URL` in `.env.local` matches how you're accessing the app
- Restart dev server after changing `.env.local`
- Clear browser cookies and try again
- Check JWK key is valid (regenerate if needed)

**Symptom:** Redirect loop after login

**Solutions:**

- Clear browser cookies
- Restart dev server
- Try in incognito/private browsing mode
- Check Redis is running and accessible

### OAuth Branding

OAuth branding (custom logo, colors, CSS on the PDS sign-in pages) only works when **both** conditions are met:

1. **The PDS is a certified PDS** — branding is a feature of certified PDS instances (e.g. `pds-eu-west4.test.certified.app`). Standard/uncertified PDS instances do not support custom OAuth branding.
2. **Your app's client URL has been added to the PDS's trusted OAuth clients list** — the PDS only applies branding CSS for client URLs registered in its `PDS_OAUTH_TRUSTED_CLIENTS` environment variable. Even if your app serves correct branding metadata at `/client-metadata.json`, the PDS will ignore it unless your URL is explicitly trusted.

Additionally, branding cannot work in local development (loopback mode). When using a loopback `client_id` (localhost/127.0.0.1), the PDS auto-generates minimal client metadata and ignores custom branding fields. This is part of the ATProto specification.

#### Getting your domain trusted by the PDS

To get a domain added to the PDS trusted clients list:

1. **Contact @aspiers on GitHub** with your request
2. **Provide the full client_id URL** (e.g., `https://your-app.vercel.app/client-metadata.json`)
3. **Production/stable URLs are preferred** over ephemeral URLs

Once your domain is added to the trusted list, the PDS will apply your branding CSS to the OAuth consent pages.

**Vercel deployments:** Your Vercel production URL must also be added to the PDS trusted clients list for branding to appear. The app serves branding metadata automatically — the only requirement is that the URL is trusted by the PDS.

### Build Errors After Lexicon Update

**Symptom:** TypeScript errors, import errors, type mismatches

**Solutions:**

- Check for breaking changes in the lexicon package
- Update type definitions in scaffold code
- Check for deprecated APIs
- Update import statements if the lexicon package reorganized exports
- Check lexicon version compatibility with Next.js/React versions

### ngrok Issues

**Symptom:** Works locally but not with ngrok

**Solutions:**

- Update `NEXT_PUBLIC_BASE_URL` to your ngrok URL (e.g., `https://abc123.ngrok-free.app`)
- Restart dev server after changing URL
- Note: ngrok URLs change on each restart unless you have a paid plan

---

## Contributing

We welcome contributions! This scaffold is a community resource for learning and building with Hypercerts and ATProto.

### Reporting Issues

Found a bug or have a question? We'd love to hear from you!

1. **Check existing issues first:** https://github.com/hypercerts-org/hypercerts-scaffold-atproto/issues
2. **Create a new issue** with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Lexicon version (check `package.json`)
   - Screenshots/logs if relevant
   - Your environment (OS, Node version, etc.)

**Maintainer:** [@kzoeps](https://github.com/kzoeps) will respond to issues and review PRs.

### Pull Requests

We accept pull requests for:

- Bug fixes
- Documentation improvements
- New example features
- Code quality improvements
- Better error handling
- Performance optimizations

**Process:**

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly** (especially if lexicon-related):
   - Run the dev server
   - Test login/auth flow
   - Test creating/viewing hypercerts
   - Run linter: `pnpm run lint`
   - Build: `pnpm run build`
5. **Commit with clear messages:** Follow conventional commits if possible
6. **Push to your fork:** `git push origin feature/amazing-feature`
7. **Open a Pull Request** with:
   - Clear description of changes
   - Why the change is needed
   - What testing you've done
   - Any breaking changes
   - Screenshots if UI changes

### Lexicon-Dependent Changes

If your contribution depends on a newer lexicon version:

1. **Document which lexicon version is required** in the PR description
2. **Update the lexicon dependency** (follow "Updating the Lexicon Package" above)
3. **Include both the code changes and the lexicon update** in the same PR
4. **Note any breaking changes** in the PR description
5. **Test extensively** - you're changing a critical dependency

### Breaking Changes

If you're making breaking changes to the scaffold:

1. Document what breaks and why the change is necessary
2. Provide migration guide if applicable
3. Update documentation
4. Consider versioning/tagging the release

### Code Style

- Follow the existing code style
- Use TypeScript strict mode
- Add JSDoc comments for public functions
- Keep components small and focused
- Use meaningful variable names
- Add comments for complex logic

---

## Project Structure

```
hypercerts-scaffold/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── oauth/        # OAuth flow endpoints (ATProto + ePDS)
│   │   ├── certs/        # Hypercert operations
│   │   └── profile/      # Profile management
│   ├── hypercerts/       # Hypercert pages
│   └── profile/          # Profile page
├── components/            # React components
├── lib/                   # Core libraries
│   ├── api/              # API client utilities
│   ├── hypercerts-sdk.ts # OAuth client initialization (NodeOAuthClient)
│   ├── atproto-writes.ts # ATProto write utilities
│   ├── record-validation.ts # Lexicon record validation
│   ├── types.ts          # TypeScript types and Collections enum
│   ├── blob-utils.ts     # Blob URL resolution
│   ├── repo-context.ts   # Repository context helper
│   └── ...
├── providers/             # React context providers
├── queries/               # TanStack Query hooks
├── .env.example          # Environment variable template
└── .env.local            # Your local environment (gitignored)
```

### Key Files

| File                          | Purpose                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| `lib/hypercerts-sdk.ts`       | Initializes NodeOAuthClient with OAuth config, Redis storage |
| `lib/atproto-writes.ts`       | ATProto write utilities for CRUD operations                  |
| `lib/record-validation.ts`    | Lexicon record validation helpers                            |
| `lib/types.ts`                | TypeScript types and Collections enum                        |
| `lib/blob-utils.ts`           | Blob URL resolution utilities                                |
| `lib/repo-context.ts`         | Helper to get authenticated repository context               |
| `lib/create-actions.ts`       | Server actions for CRUD operations via native ATProto        |
| `providers/OAuthProvider.tsx` | Client-side OAuth state management                           |
| `app/api/oauth/*`             | ATProto OAuth flow endpoints (login, callback, logout)       |
| `app/api/oauth/epds/*`        | ePDS email OAuth flow endpoints (login, callback)            |

---

## Getting Help

- **Issues/Bugs:** https://github.com/hypercerts-org/hypercerts-scaffold-atproto/issues
- **Maintainer:** [@kzoeps](https://github.com/kzoeps)
- **Lexicon Repository:** https://github.com/hypercerts-org/hypercerts-sdk
- **Hypercerts Docs:** https://hypercerts.org/docs
- **ATProto Docs:** https://atproto.com/docs

---

## License

This scaffold is open source and available under the same license as the Hypercerts lexicon package.
