# Development Guide

## ⚠️ CRITICAL: Unreleased SDK Version

This scaffold uses a **packed, unreleased version** of `@hypercerts-org/sdk-core`:

- **Current version:** `0.10.0-beta.8`
- **Location:** `vendor/hypercerts-org-sdk-core-0.10.0-beta.8.tgz`
- **Source:** Built directly from https://github.com/hypercerts-org/hypercerts-sdk (not npm)

### Why We Do This

This allows us to **dogfood** the latest SDK changes before they're officially released:

- Test new features in a real-world application
- Catch bugs and issues early in development
- Validate API design decisions with actual usage
- Provide rapid feedback to SDK maintainers
- Demonstrate cutting-edge capabilities to developers

### ⚠️ Important Warnings

1. **Contains unreleased changes** - Some features may not be merged to main yet
2. **Breaking changes expected** - The SDK is evolving rapidly toward 1.0
3. **Installing the latest SDK version may break this scaffold** - We test against specific packed versions
4. **Not suitable for production** - This is a development/testing scaffold

### What This Means For You

- Code examples may use APIs not yet in the published npm package
- Upgrading to newer SDK versions may require code changes in the scaffold
- You may encounter bugs that don't exist in stable releases
- Some features might change or be removed before official release
- Documentation here may be ahead of the official SDK docs

---

## What is a "Packed" Package?

A packed package is a `.tgz` file created by `npm pack` or `pnpm pack`. It's essentially a tarball of the package that would normally be published to npm.

### Normal npm install:

```json
"@hypercerts-org/sdk-core": "^0.10.0"  // from npm registry
```

### Packed version (what we use):

```json
"@hypercerts-org/sdk-core": "file:vendor/hypercerts-org-sdk-core-0.10.0-beta.8.tgz"  // from local file
```

This gives us precise control over which version we're using and lets us test unreleased code directly from the SDK repository.

---

## Updating the Vendor SDK Package

### ⚠️ WARNING

**Installing a newer SDK version may break the scaffold.** The scaffold code is written against a specific SDK version. Breaking changes in newer SDK versions may require updates to:

- Type definitions
- API calls
- Authentication flows
- Data structures
- Error handling

**Always test thoroughly** after updating the SDK!

### Step-by-Step Instructions

#### 1. Clone the Hypercerts SDK repository

```bash
cd .. # or wherever you keep your projects
git clone https://github.com/hypercerts-org/hypercerts-sdk
cd hypercerts-sdk
```

If you already have it cloned, make sure it's up to date:

```bash
cd /path/to/hypercerts-sdk
git fetch origin
```

#### 2. Check out the specific commit/branch you want

```bash
git checkout main  # or a specific branch/commit
git pull
```

To test a specific feature branch:

```bash
git checkout feature/new-feature
git pull
```

#### 3. Install dependencies and build

```bash
pnpm install
pnpm build
```

Check for build errors. If the SDK doesn't build, it won't work in the scaffold!

#### 4. Pack the SDK

Navigate to the sdk-core package directory:

```bash
cd packages/sdk-core  # adjust path if package structure changes
pnpm pack
```

This creates a file like `hypercerts-org-sdk-core-0.10.0-beta.9.tgz` in the current directory.

#### 5. Copy to the scaffold's vendor directory

```bash
cp hypercerts-org-sdk-core-0.10.0-beta.9.tgz /path/to/hypercerts-scaffold/vendor/
```

#### 6. Update package.json in the scaffold

Edit the scaffold's `package.json`:

```json
{
  "dependencies": {
    "@hypercerts-org/sdk-core": "file:vendor/hypercerts-org-sdk-core-0.10.0-beta.9.tgz"
  }
}
```

#### 7. Install and test

```bash
cd /path/to/hypercerts-scaffold
pnpm install
```

This will extract the packed SDK and install it as a dependency.

#### 8. Test all critical functionality

Start the dev server:

```bash
pnpm run dev
```

Test these critical flows:

- ✅ Login/authentication
- ✅ Creating hypercerts
- ✅ Viewing hypercerts
- ✅ Viewing/editing profile
- ✅ OAuth callback handling
- ✅ Session management

Check the console for errors and warnings.

#### 9. If everything works, commit

```bash
git add vendor/ package.json pnpm-lock.yaml
git commit -m "chore: update SDK to 0.10.0-beta.9"
git push
```

**Document breaking changes** if you had to update scaffold code to accommodate SDK changes.

### Troubleshooting

**Build errors after SDK update:**

- Check that the SDK version is compatible with the scaffold's TypeScript version
- Check for breaking changes in SDK type definitions
- Update type imports if SDK has reorganized exports

**Runtime errors:**

- Check SDK release notes or commit messages for breaking API changes
- Check if authentication flow has changed
- Check if data structures have changed

**Type errors:**

- SDK may have changed type definitions
- Update your code to match new types
- Check if SDK has deprecated/removed types you were using

**Import errors:**

- SDK may have reorganized exports
- Check SDK source for new import paths
- Update import statements accordingly

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

### Build Errors After SDK Update

**Symptom:** TypeScript errors, import errors, type mismatches

**Solutions:**

- Check for breaking changes in SDK
- Update type definitions in scaffold code
- Check for deprecated APIs
- Update import statements if SDK reorganized exports
- Check SDK version compatibility with Next.js/React versions

### ngrok Issues

**Symptom:** Works locally but not with ngrok

**Solutions:**

- Update `NEXT_PUBLIC_BASE_URL` to your ngrok URL (e.g., `https://abc123.ngrok.io`)
- Restart dev server after changing URL
- Note: ngrok URLs change on each restart unless you have a paid plan

---

## Contributing

We welcome contributions! This scaffold is a community resource for learning and building with the Hypercerts SDK.

### Reporting Issues

Found a bug or have a question? We'd love to hear from you!

1. **Check existing issues first:** https://github.com/hypercerts-org/hypercerts-scaffold-atproto/issues
2. **Create a new issue** with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - SDK version (check `vendor/` directory)
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
4. **Test thoroughly** (especially if SDK-related):
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

### SDK-Dependent Changes

If your contribution depends on a newer SDK version:

1. **Document which SDK version is required** in the PR description
2. **Update the vendor package** (follow "Updating the Vendor SDK Package" above)
3. **Include both the code changes and the SDK update** in the same PR
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
│   │   ├── auth/         # Authentication endpoints
│   │   ├── certs/        # Hypercert operations
│   │   └── profile/      # Profile management
│   ├── hypercerts/       # Hypercert pages
│   └── profile/          # Profile page
├── components/            # React components
├── lib/                   # Core libraries
│   ├── api/              # API client utilities
│   ├── hypercerts-sdk.ts # SDK initialization
│   ├── repo-context.ts   # Repository context helper
│   └── ...
├── providers/             # React context providers
├── queries/               # TanStack Query hooks
├── vendor/                # Packed SDK versions
│   └── hypercerts-org-sdk-core-*.tgz
├── .env.example          # Environment variable template
└── .env.local            # Your local environment (gitignored)
```

### Key Files

| File                          | Purpose                                          |
| ----------------------------- | ------------------------------------------------ |
| `lib/hypercerts-sdk.ts`       | Initializes the Hypercerts SDK with OAuth config |
| `lib/repo-context.ts`         | Helper to get authenticated repository context   |
| `lib/create-actions.ts`       | Server actions for common operations             |
| `providers/OAuthProvider.tsx` | Client-side OAuth state management               |
| `app/api/auth/*`              | OAuth flow endpoints (login, callback, logout)   |

---

## Testing Against SDK Changes

If you're an SDK maintainer or want to test SDK changes:

### Quick Test Cycle

1. **Make SDK changes**
2. **Build SDK:** `pnpm build` (in SDK repo)
3. **Pack SDK:** `pnpm pack` (in SDK package directory)
4. **Copy to scaffold:** `cp *.tgz /path/to/scaffold/vendor/`
5. **Update scaffold package.json** to point to new `.tgz`
6. **Install:** `pnpm install` (in scaffold)
7. **Test:** `pnpm run dev` (in scaffold)
8. **Iterate:** Repeat as needed

### Using `pnpm link` (alternative)

For rapid iteration, you can link the SDK directly:

```bash
# In SDK repo
cd packages/sdk-core
pnpm link

# In scaffold repo
pnpm link @hypercerts-org/sdk-core
```

**Note:** Remember to unlink and restore the packed version before committing!

---

## Getting Help

- **Issues/Bugs:** https://github.com/hypercerts-org/hypercerts-scaffold-atproto/issues
- **Maintainer:** [@kzoeps](https://github.com/kzoeps)
- **SDK Repository:** https://github.com/hypercerts-org/hypercerts-sdk
- **Hypercerts Docs:** https://hypercerts.org/docs
- **ATProto Docs:** https://atproto.com/docs

---

## License

This scaffold is open source and available under the same license as the Hypercerts SDK.
