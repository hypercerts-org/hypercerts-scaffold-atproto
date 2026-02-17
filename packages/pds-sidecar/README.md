# PDS Sidecar

A standalone Express.js auth service that runs alongside the stock `@atproto/pds` package to provide email-first passwordless login via OTP codes.

## Architecture

This is a monorepo with three sub-packages:

- **`packages/shared/`** — DB, OTP service, rate limiter, HMAC signer, mailer
- **`packages/auth-service/`** — Express auth service
- **`packages/pds-core/`** — PDS wrapper

## Getting Started

```bash
npm install
npm run build
```

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
```

## Structure

```
pds-sidecar/
├── package.json          # Root workspace config
├── tsconfig.json         # Root TypeScript config
├── packages/
│   ├── shared/           # Shared utilities
│   │   └── src/
│   │       ├── index.ts  # Re-exports
│   │       ├── db.ts     # SQLite database setup
│   │       ├── types.ts  # Shared TypeScript types
│   │       └── logger.ts # Pino logger
│   ├── auth-service/     # Express auth service
│   │   └── src/
│   │       └── index.ts  # Express app + health check
│   └── pds-core/         # PDS wrapper
│       └── src/
│           └── index.ts  # PDS startup script
```
