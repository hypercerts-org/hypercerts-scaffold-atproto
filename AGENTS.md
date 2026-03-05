# Agent Instructions

This project uses **hb** (beads) for issue tracking. Run `hb onboard` to get started.

## Quick Reference

```bash
hb ready              # Find available work
hb show <id>          # View issue details
hb update <id> --status in_progress  # Claim work
hb close <id>         # Complete work
hb sync               # Sync with git
```

## Build / Lint / Test Commands

```bash
pnpm install              # Install dependencies (uses pnpm, not npm/yarn)
pnpm run build            # Production build — the primary quality gate
pnpm run dev              # Dev server at http://127.0.0.1:3000
pnpm run lint             # ESLint (flat config, eslint.config.mjs)
pnpm run format           # Prettier — format all files
pnpm run format:check     # Prettier — check without writing
npx tsc --noEmit          # Type-check without emitting
```

There is no test suite. **`pnpm run build`** is the primary verification step — always run it after changes. A pre-commit hook runs `lint-staged` (prettier + eslint --fix on staged `.ts`/`.tsx` files).

## Architecture Overview

Next.js 16 App Router with native ATProto. No SDK wrapper — all record operations use `@atproto/api` Agent directly. `@hypercerts-org/lexicon` provides TypeScript types and `validateRecord` functions.

### Key Layers (dependency order)

| File                       | Purpose                                                         | Environment |
| -------------------------- | --------------------------------------------------------------- | ----------- |
| `lib/config.ts`            | Env vars, OAuth scope, client metadata                          | Server      |
| `lib/hypercerts-sdk.ts`    | `NodeOAuthClient` singleton + Redis stores                      | Server      |
| `lib/atproto-session.ts`   | `getSession()`, `getAgent()` — low-level session access         | Server      |
| `lib/repo-context.ts`      | `getRepoContext()` → `{ userDid, activeDid, targetDid, agent }` | Server      |
| `lib/record-validation.ts` | `assertValidRecord()` — generic lexicon validation              | Shared      |
| `lib/atproto-writes.ts`    | `resolveStrongRef`, `createLocationRecord`, `uploadContentBlob` | Server      |
| `lib/blob-utils.ts`        | `resolveBlobToUrl`, `resolveRecordBlobs` — BlobRef→URL          | Server      |
| `lib/queries.ts`           | Stateless read/write wrappers (take `Agent` as param)           | Shared      |
| `lib/create-actions.ts`    | `"use server"` actions — session-aware CRUD                     | Server      |
| `lib/types.ts`             | All TypeScript types, `Collections` enum, type guards           | Shared      |
| `lib/utils.ts`             | AT-URI parsing, blob URLs, `cn()`, `getStringField`             | Shared      |

Server-only files use `import "server-only"` or `"use server"` directive.

## Code Style

### Formatting (enforced by Prettier + lint-staged)

- **Double quotes** for strings (not single quotes)
- **Semicolons** required
- **2-space** indentation
- **Trailing commas** everywhere (`"all"`)
- **80-char** print width
- **LF** line endings
- Tailwind classes are auto-sorted by `prettier-plugin-tailwindcss`

### Imports

- Use `@/*` path alias for project imports: `import { parseAtUri } from "@/lib/utils"`
- Group imports: (1) `"server-only"` / `"use server"`, (2) external packages, (3) `@/` project imports, (4) relative imports
- Use `import type` for type-only imports: `import type { BlobRef } from "@atproto/lexicon"`
- Import lexicon namespaces, not individual types: `import { OrgHypercertsClaimActivity } from "@hypercerts-org/lexicon"`, then use `OrgHypercertsClaimActivity.Record`

### TypeScript

- **Strict mode** enabled — no `any` unless absolutely necessary
- Never use `as unknown as T` double-casts — use type guards or `isRecord()` validators from lexicon
- Define interfaces for function params and return types in `lib/types.ts`
- Use `asserts` return types for validation functions
- Use lexicon types (`OrgHypercertsClaimActivity.Record`) for record shapes, not hand-rolled interfaces
- Validate records with `assertValidRecord(label, record, Namespace.validateRecord)` before every `createRecord`/`putRecord`

### Naming

- Files: `kebab-case.ts` (e.g., `atproto-writes.ts`, `blob-utils.ts`)
- React components: `PascalCase` function + `kebab-case` file (e.g., `HypercertDetailsView` in `hypercert-detail-view.tsx`)
- Exported functions: `camelCase` (e.g., `getRepoContext`, `resolveStrongRef`)
- Interfaces/types: `PascalCase` (e.g., `RepoContext`, `StrongRef`)
- Enums: `PascalCase` name, `camelCase` members (e.g., `Collections.claim`)
- Constants: `UPPER_SNAKE_CASE` for config values (e.g., `OAUTH_SCOPE`, `HYPERCERT_COLLECTIONS`)

### React / Next.js Patterns

- Server Components by default — add `"use client"` only when needed (hooks, event handlers)
- Use `React.cache()` for request-scoped memoization of async functions (`getRepoContext`, `getAgent`)
- Use `dynamic()` imports with loading skeletons for heavy client components
- Props are typed inline for components: `function Foo({ bar }: { bar: string })`
- Use TanStack Query (`@tanstack/react-query`) for client-side data fetching
- UI primitives come from `components/ui/` (shadcn/ui + Radix)
- Use `cn()` from `lib/utils` for conditional Tailwind classes

### Error Handling

- API routes: wrap entire handler in `try/catch`, return `NextResponse.json({ error }, { status })`
- Validate inputs early, return 400 with specific error messages
- Check ownership (DID match) before mutations, return 403
- Use `.catch(() => null)` for optional fetches that may 404
- Server actions: throw errors (caught by React error boundaries)
- Log errors with `console.error()` including context (function name, relevant IDs)

### ATProto Patterns

- All writes go through `agent.com.atproto.repo.{createRecord,putRecord,deleteRecord}`
- Always call `assertValidRecord()` before writes
- Parse AT-URIs with `parseAtUri()` from `lib/utils` — returns `{ did, collection, rkey }`
- Use `resolveStrongRef()` to get `{ uri, cid }` for cross-record references
- Use `getStringField(formData, key)` instead of `formData.get(key) as string`
- Collection NSIDs are in the `Collections` enum in `lib/types.ts`
- Blob uploads: `agent.com.atproto.repo.uploadBlob(blob)` → returns `BlobRef`
- Resolve BlobRefs to URLs for client rendering via `resolveRecordBlobs()`

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** — Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) — `pnpm run build` must pass
3. **Update issue status** — Close finished work, update in-progress items
4. **PUSH TO REMOTE** — This is MANDATORY:
   ```bash
   git pull --rebase
   hb sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** — Clear stashes, prune remote branches
6. **Verify** — All changes committed AND pushed
7. **Hand off** — Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing — that leaves work stranded locally
- NEVER say "ready to push when you are" — YOU must push
- If push fails, resolve and retry until it succeeds
