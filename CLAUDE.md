# Emberly — Claude Code Guide

Emberly is an open-source, self-hosted file sharing and user identity platform built with Next.js. It provides S3-backed file hosting, URL shortening, rich embeds, team collaboration (Nexium), billing via Stripe, and a multi-provider object storage provisioning system.

---

## Repository at a Glance

| Aspect          | Detail                                            |
| --------------- | ------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack in dev)         |
| Language        | TypeScript 5.9, strict                            |
| Database        | PostgreSQL via Prisma 7                           |
| Cache           | Redis                                             |
| Auth            | NextAuth v4 (Discord, GitHub OAuth + credentials) |
| Storage         | S3-compatible (Vultr, Linode, OVHcloud, AWS)      |
| Payments        | Stripe                                            |
| Email           | Resend or SMTP                                    |
| Styling         | Tailwind CSS 3 + shadcn/ui (Radix UI)             |
| Package manager | Bun                                               |
| License         | AGPL-3.0-only                                     |

---

## Common Commands

```bash
# Development
bun dev            # Next.js dev server with Turbopack

# Build
bun run build      # Production build
bun run typecheck  # tsc --noEmit (no build, just types)
bun run lint       # ESLint
bun run lint:fix   # ESLint with auto-fix
bun run format     # Prettier write
bun run format:check  # Prettier check (used in CI)

# Database
bun run db:generate   # prisma generate (regenerate client after schema changes)
bun run db:migrate    # prisma migrate dev (create + apply migration in dev)
bun run db:deploy     # prisma migrate deploy (apply existing migrations in prod)
bun run db:push       # prisma db push (schema sync without migrations — dev only)
bun run db:studio     # Open Prisma Studio
bun run db:seed       # Seed subscription plans

# Packages
bun add <pkg>      # Add a dependency
bun remove <pkg>   # Remove a dependency

# Security
bunx socket@latest check  # Run socket.dev supply chain check locally
```

**Always run `bun run db:generate` after editing `prisma/schema.prisma`.**

---

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── (main)/             # Authenticated and public pages
│   ├── (raw)/              # Raw file serving routes
│   ├── (shorturl)/         # Short URL redirect routes
│   └── api/                # REST API handlers
│       ├── admin/          # Admin-only endpoints
│       ├── auth/           # NextAuth endpoints
│       ├── files/          # File management API
│       ├── payments/       # Stripe webhooks & checkout
│       └── ...
├── packages/
│   ├── lib/                # Server-side utilities and service clients
│   │   ├── auth/           # NextAuth config and session helpers
│   │   ├── cache/          # Redis helpers
│   │   ├── cloudflare/     # Cloudflare DNS API
│   │   ├── config/         # Site configuration (DB-backed, Zod-validated)
│   │   ├── database/       # Prisma client singleton
│   │   ├── events/         # Event emitter / async worker
│   │   ├── files/          # File upload, chunking, OCR pipeline
│   │   ├── logger/         # Pino structured logging
│   │   ├── nexium/         # Team / squad business logic
│   │   ├── plans/          # Subscription plan limits
│   │   ├── security/       # Rate limiting, password policy, breach detection
│   │   ├── storage/        # Object storage abstraction
│   │   │   ├── index.ts               # Provider singleton & bucket routing
│   │   │   ├── bucket-provisioning.ts # Auto-provision per-user buckets
│   │   │   ├── sync-buckets.ts        # Stripe ↔ bucket reconciliation
│   │   │   ├── types.ts               # StorageProvider interface
│   │   │   └── providers/
│   │   │       ├── s3.ts              # S3StorageProvider (AWS SDK v3)
│   │   │       ├── local.ts           # LocalStorageProvider (dev/test)
│   │   │       ├── vultr.ts           # Vultr Object Storage management API
│   │   │       ├── linode.ts          # Linode Object Storage management API
│   │   │       └── ovhcloud.ts        # OVHcloud Public Cloud Object Storage API
│   │   ├── stripe/         # Stripe client, billing helpers, webhook handlers
│   │   └── ...
│   ├── components/         # React components (UI library, admin, dashboard, etc.)
│   │   └── ui/             # shadcn/ui base components
│   ├── hooks/              # React hooks
│   └── types/              # Shared TypeScript types
├── prisma/
│   └── schema.prisma       # Single source of truth for the DB schema
├── scripts/                # One-off scripts (seeding, media kit generation)
├── public/                 # Static assets
├── .github/workflows/      # CI: build, quality, CodeQL, socket.dev
├── socket.yml              # socket.dev supply-chain security config
└── .claude/                # Claude Code project settings and commands
```

---

## Path Aliases

All imports should use these aliases — never use relative paths that cross package boundaries.

| Alias            | Resolves to               |
| ---------------- | ------------------------- |
| `@/*`            | `/` (root)                |
| `@/packages/*`   | `packages/*`              |
| `@/lib/*`        | `packages/lib/*`          |
| `@/components/*` | `packages/components/*`   |
| `@/hooks/*`      | `packages/hooks/*`        |
| `@/types/*`      | `packages/types/*`        |
| `@/database/*`   | `packages/lib/database/*` |

---

## Architecture Patterns

### API Routes

All API handlers live under `app/api/`. Use the shared response helpers:

```ts
import { apiResponse, apiError, HTTP_STATUS } from '@/packages/lib/api/response'
import { requireAdmin } from '@/packages/lib/auth/api-auth'
```

### Configuration

Site configuration is stored in PostgreSQL and cached. Access it with:

```ts
import { getConfig, getIntegrations } from '@/packages/lib/config'
```

Integration credentials (Vultr API key, OVH keys, etc.) come from `getIntegrations()` with
fallback to environment variables. New integrations must be added to the Zod schema in
`packages/lib/config/index.ts` under `settings.integrations`.

### Storage Providers

The storage layer has two levels:

1. **File I/O** (`StorageProvider` interface in `packages/lib/storage/types.ts`) — used by `S3StorageProvider` and `LocalStorageProvider` for upload, download, streaming, presigned URLs. Get the provider via `getStorageProvider()` or per-bucket via `getProviderForStoredFile()`.

2. **Provisioning API clients** (`packages/lib/storage/providers/*.ts`) — Vultr, Linode, OVHcloud management APIs for creating and deleting the underlying instances/keys that pools run on. These are **not** `StorageProvider` implementations; they are admin-facing REST clients.

When a user subscribes to a storage plan, `provisionBucketForUserSubscription()` picks the best
`ObjectStoragePool` by region/tier, calls the provider-specific bucket creation function, and
writes a `StorageBucket` record linked to the pool.

### ObjectStoragePool

The unified DB model for all provisioned storage pools (`VultrObjectStorage` was migrated here).

- `provider`: `'vultr' | 'linode' | 'ovhcloud'`
- `externalId`: provider resource ID (Vultr instance UUID, Linode key label, `projectId/regionName` for OVH)
- `metadata: Json` — provider-specific: `{ clusterId }` / `{ keyId, linodeClusterId }` / `{ projectId, regionName, credentialAccess }`
- `s3AccessKey` / `s3SecretKey` / `s3Hostname` — S3-compatible credentials used at upload time

### Events

Async work is handled through the event system in `packages/lib/events/`. Emit events with:

```ts
import { events } from '@/packages/lib/events'
await events.emit('user.bucket-provisioned', { ... })
```

Handlers are registered in the worker process. Never block a request waiting for event
side-effects — fire and let the worker handle it.

### Logging

Use named loggers, never `console.*`:

```ts
import { loggers } from '@/packages/lib/logger'
const logger = loggers.storage // or .api, .files, .auth, etc.
logger.info('message', { contextKey: value })
logger.error('message', error as Error, { extra })
```

---

## Database

**Schema:** `prisma/schema.prisma` — the single source of truth.

Key models: `User`, `File`, `StorageBucket`, `ObjectStoragePool`, `NexiumSquad`, `Subscription`, `Product`, `Event`, `Config`.

**After any schema change:**

```bash
yarn db:migrate    # Creates migration file + applies it
yarn db:generate   # Regenerates Prisma client
```

Never use `db:push` in staging/production — always use `db:deploy`.

---

## Environment Variables

Copy `.env.template` to `.env.local` and fill in values:

```
DATABASE_URL           # PostgreSQL connection string
REDIS_URL              # Redis connection string
NEXTAUTH_URL           # e.g. http://localhost:3000
NEXT_PUBLIC_BASE_URL   # Public-facing base URL
NEXTAUTH_SECRET        # ≥32 chars random string
DISCORD_OAUTH_*        # Discord OAuth app credentials
GITHUB_OAUTH_*         # GitHub OAuth app credentials
VIRUSTOTAL_API_KEY     # File scanning (optional in dev)
NEXT_PUBLIC_SENTRY_DSN # Error tracking (optional in dev)
EMBERLY_RUN_CLOUD      # Set true to enable cloud features (billing, Nexium, custom domains, marketing pages)
NEXT_PUBLIC_EMBERLY_RUN_CLOUD # Same value, mirrored for client-side nav/UI — must match EMBERLY_RUN_CLOUD
EMBERLY_RUN_EVENT_WORKER # Set true to run the event worker
```

Provider-specific keys (Vultr, Linode, OVHcloud, Stripe, Resend, Cloudflare) are configured via
the Admin → Integrations panel and stored in the database, not in `.env`.

---

## Code Style

- **No comments** unless the WHY is non-obvious (hidden constraint, workaround, invariant).
- **No `console.*`** — use `loggers.*`.
- **No `any`** unless unavoidable and justified; prefer `unknown` + narrowing.
- ESLint and Prettier run on commit via lint-staged. Commit messages must follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- Imports: path aliases only (`@/packages/...`), never deep relative paths.
- Tailwind: use utility classes directly; avoid inline `style={}` except for dynamic values.

---

## CI

| Workflow      | Triggers                | What it does                          |
| ------------- | ----------------------- | ------------------------------------- |
| `build.yml`   | push/PR → master or dev | Install, Prisma migrate, `next build` |
| `quality.yml` | push/PR → master or dev | `tsc --noEmit`, `eslint .`            |
| `codeql.yml`  | push master/dev, weekly | CodeQL static analysis (JS/TS)        |
| `socket.yml`  | push/PR → master or dev | Socket.dev supply-chain scan          |

---

## Security Notes

- File uploads are scanned with VirusTotal before becoming publicly accessible.
- Rate limiting is applied at the middleware level via `packages/lib/security/`.
- All storage admin API routes require `requireAdmin()` — never skip this check.
- S3 secrets are **never** returned to clients; responses always show a masked prefix.
- The `ObjectStoragePool.metadata` JSON field may contain credential references — treat it as sensitive.
- Supply chain security is enforced by socket.dev on every PR (see `socket.yml` and `.github/workflows/socket.yml`).
