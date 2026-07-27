# AGENTS.md — Emberly Codebase Guide for AI Agents

This file is for AI coding assistants (Claude Code, GitHub Copilot, Cursor, etc.). It provides the practical context needed to work effectively in this codebase without re-deriving it every session.

---

## Project at a glance

**Emberly** is an open-source file storage, sharing, discovery, and identity-verification platform.
Stack: **Next.js 16 App Router · TypeScript (strict) · PostgreSQL (Prisma) · Redis · S3-compatible storage · Tailwind CSS · shadcn/ui**
License: AGPL-3.0-only

---

## Essential commands

```bash
# Install
bun install

# Dev server (Turbopack)
bun dev                     # http://localhost:3000

# Type check (no emit)
bun typecheck               # tsc --noEmit

# Lint / format
bun lint
bun lint:fix
bun format                  # Prettier across all .ts/.tsx/.json/.md

# Build
bun run build

# Database
bun run db:generate         # Regenerate Prisma client after schema changes
bun run db:migrate          # Create + apply a dev migration
bun run db:deploy           # Apply migrations (production/CI)
bun run db:push             # Push schema without a migration (prototyping only)
bun run db:studio           # GUI at http://localhost:5555
bun run db:seed             # Seed subscription plans
```

Run `bun typecheck` and `bun lint` before committing. Both run in CI.

---

## Directory map

```
app/                        Next.js App Router
  (main)/                   UI pages (auth, admin, [userUrlId] file serving)
  (raw)/                    Raw file responses
  (shorturl)/               Short-URL redirect handler
  api/                      ~180 REST endpoints (admin/, auth/, files/, users/, urls/, ...)

packages/
  components/               React component library
    ui/                     shadcn/ui base components
    admin/                  Admin UI
    dashboard/              User dashboard
    auth/                   Auth UI
    file/                   File management UI
    theme/                  Snowfall / effects / dark mode
    providers/              Context providers
    shared/                 Cross-cutting UI helpers
  hooks/                    Custom React hooks (use-file-upload, use-profile, ...)
  lib/                      Business logic
    api/handler.ts          Middleware wrapper for all API routes (auth, logging, error)
    auth/                   NextAuth config + helpers
    events/                 Event system (emitter · consumer · worker · handlers/)
    database/               Prisma client singleton
    cache/                  Redis helpers
    storage/                S3 / Vultr integration
    emails/                 Resend email templates
    stripe/                 Payment processing
    permissions/            RBAC permission helpers
    nexium/                 Team/squad system
    security/               Security utilities
    logger/                 Pino structured logging
    startup/index.ts        Server initialization (event system, Sentry, monitoring)
  types/                    Shared TypeScript definitions
    events.ts               Discriminated-union event types
    dto/                    Data-transfer object types

prisma/
  schema.prisma             Source of truth for DB models
  migrations/               Migration history (do not edit manually)
  generated/                Generated Prisma client (do not edit)

scripts/                    One-off utilities (seed, media-kit, migration helpers)
public/                     Static assets
.github/                    CI workflows, CONTRIBUTING.md
```

---

## API route conventions

Every API handler must go through the wrapper in [packages/lib/api/handler.ts](packages/lib/api/handler.ts). It handles:

- Request-ID tagging
- Structured logging (Pino)
- Session/auth validation
- Standardized error responses

**Never** write raw `NextResponse` handlers — always use the handler wrapper.

```typescript
// Correct pattern
import { createHandler } from '@/lib/api/handler'

export const GET = createHandler(async (req, ctx) => {
  // ctx.session is populated if the handler requires auth
})
```

---

## Event system

Background work goes through the event system in [packages/lib/events/](packages/lib/events/).

- **Emit**: `packages/lib/events/emitter.ts` — publishes a typed event to the DB
- **Handle**: `packages/lib/events/handlers/` — one file per domain (auth, file, email, billing, discord, audit, …)
- **Worker**: runs when `EMBERLY_RUN_EVENT_WORKER=true`; processes queued events asynchronously

Add new handlers in `handlers/` and register them in the consumer. Event types are in [packages/types/events.ts](packages/types/events.ts) — extend the discriminated union there first.

---

## Path aliases

Configured in `tsconfig.json`. Use these everywhere; never use `../../..` relative paths across package boundaries.

| Alias            | Resolves to             |
| ---------------- | ----------------------- |
| `@/*`            | project root            |
| `@/components/*` | `packages/components/*` |
| `@/lib/*`        | `packages/lib/*`        |
| `@/hooks/*`      | `packages/hooks/*`      |
| `@/types/*`      | `packages/types/*`      |
| `@/database/*`   | `prisma/*`              |

---

## Code style rules

- **TypeScript strict mode** — no implicit `any`. Use `unknown` + type narrowing instead.
- **No `any`** — ESLint enforces this. The only allowed escape hatch is an explicit disable comment with a reason.
- **Server components by default** — only add `'use client'` when hooks, events, or browser APIs are required.
- **Functional components only** — hooks for state and side-effects.
- **Tailwind for styling** — no inline styles, no CSS modules. Dark mode is implemented via Tailwind's `dark:` variant.
- **shadcn/ui base components** — extend from `packages/components/ui/`, do not fork the components themselves.
- **No comments explaining what the code does** — only add a comment when the _why_ is non-obvious (hidden constraint, workaround, invariant).

### Naming

| Thing                 | Convention             |
| --------------------- | ---------------------- |
| Files                 | `kebab-case.tsx`       |
| React components      | `PascalCase`           |
| Functions / variables | `camelCase`            |
| Constants             | `SCREAMING_SNAKE_CASE` |
| Types / interfaces    | `PascalCase`           |

### Import order (enforced by Prettier plugin)

1. React
2. Next.js
3. Third-party packages
4. `@/components/…`
5. `@/lib/…`
6. `@/hooks/…`
7. `@/types/…`
8. Relative imports

---

## Commit convention (enforced by commitlint + Husky)

```
<type>(<scope>): <subject>
```

Types: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `chore` · `ci` · `revert`

Examples:

```
feat(auth): add magic-link sign-in flow
fix(upload): resolve off-by-one in chunked upload progress
refactor(api): consolidate 404 error path in handler wrapper
```

Commits that don't match the pattern are rejected by the pre-commit hook.

---

## Database rules

- **Never** edit `prisma/migrations/` by hand.
- **Never** call `db push` in production — use `db deploy`.
- After any change to `schema.prisma`, run `bun run db:generate` to regenerate the client.
- The Prisma client singleton lives in `packages/lib/database/` — always import from there, never instantiate `PrismaClient` directly.
- Keep the generated client out of git (`prisma/generated/` is gitignored). CI regenerates it.

---

## Authentication

- NextAuth v4 is configured in `packages/lib/auth/`.
- Providers: Discord OAuth, GitHub OAuth, credentials (email + password).
- Sessions are validated server-side via the API handler wrapper — do not roll your own session checks.
- 2FA (TOTP) and magic links are supported; see `packages/lib/auth/` for helpers.
- Password hashing: bcryptjs. Never store or log plaintext passwords.

---

## Permissions / RBAC

Roles: `USER` · `STAFF` · `SUPPORT` · `DEVELOPER` · `MODERATOR` · `DESIGNER` · `PARTNER`

Permission checks live in `packages/lib/permissions/`. Always use the helpers there; do not hardcode role string comparisons in route handlers.

---

## Storage

Files are stored in S3-compatible object storage (AWS S3 or Vultr Object Storage). Metadata lives in the database; content lives in the bucket.

- Client: `@aws-sdk/client-s3` — configured in `packages/lib/storage/`
- Use pre-signed URLs for uploads/downloads; never proxy raw file bytes through the Next.js process unless absolutely necessary
- Per-user bucket overrides are supported alongside the global default bucket

---

## Caching (Redis)

Redis is used for:

- Rate limiting
- Session caching
- Event handler state

Helpers are in `packages/lib/cache/`. Import from there; do not create raw Redis clients.

Redis is optional for local development but required in production.

---

## Environment variables

Copy `.env.template` → `.env` to get started. Critical variables:

| Variable                                | Purpose                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `DATABASE_URL`                          | PostgreSQL connection string                                              |
| `REDIS_URL`                             | Redis connection string                                                   |
| `NEXTAUTH_SECRET`                       | Session signing key (≥32 chars)                                           |
| `NEXTAUTH_URL` / `NEXT_PUBLIC_BASE_URL` | App base URL                                                              |
| `DISCORD_OAUTH_CLIENT_ID/SECRET`        | Discord OAuth                                                             |
| `GITHUB_OAUTH_CLIENT_ID/SECRET`         | GitHub OAuth                                                              |
| `VIRUSTOTAL_API_KEY`                    | Malware scanning for uploads                                              |
| `VULTR_API_KEY`                         | S3 bucket provisioning                                                    |
| `NEXT_PUBLIC_SENTRY_DSN`                | Client-side error tracking                                                |
| `EMBERLY_RUN_CLOUD`                     | Enable cloud features (billing, Nexium, custom domains, marketing pages)  |
| `NEXT_PUBLIC_EMBERLY_RUN_CLOUD`         | Same value, mirrored for client-side nav — must match `EMBERLY_RUN_CLOUD` |
| `EMBERLY_RUN_EVENT_WORKER`              | Enable background event processing                                        |

Never commit `.env`. Never log env vars. `SENTRY_AUTH_TOKEN` is build-time only (CI).

---

## CI pipelines

| Workflow      | Trigger                    | What it checks                               |
| ------------- | -------------------------- | -------------------------------------------- |
| `build.yml`   | push/PR → master, PR → dev | install → prisma generate → migrate → build  |
| `quality.yml` | push/PR → master, PR → dev | install → prisma generate → typecheck → lint |
| `codeql.yml`  | push → master + weekly     | CodeQL advanced security scan                |

Both `build` and `quality` use Node.js 22 + Bun + a PostgreSQL 16 service container.

---

## Security-sensitive areas

- `packages/lib/security/` — rate limiting, IP checks, bot detection
- `packages/lib/middleware/` — `auth-checker.ts`, `bot-handler.ts`
- All file uploads go through VirusTotal scanning before acceptance
- User-generated HTML is sanitized with DomPurify before rendering
- Never introduce `dangerouslySetInnerHTML` without sanitization
- SQL queries always go through Prisma — no raw SQL string interpolation
- JWT/session tokens must never appear in logs or error responses

---

## Key third-party integrations

| Service        | Package                 | Location                               |
| -------------- | ----------------------- | -------------------------------------- |
| PostgreSQL     | `@prisma/client`        | `packages/lib/database/`               |
| Redis          | `redis`                 | `packages/lib/cache/`                  |
| S3 / Vultr     | `@aws-sdk/client-s3`    | `packages/lib/storage/`                |
| Email          | `resend`                | `packages/lib/emails/`                 |
| Payments       | `stripe`                | `packages/lib/stripe/`                 |
| Error tracking | `@sentry/nextjs`        | `instrumentation.ts`, `next.config.ts` |
| Logging        | `pino`                  | `packages/lib/logger/`                 |
| OCR            | `tesseract.js`          | `packages/lib/ocr/`                    |
| Code editor    | `@uiw/react-codemirror` | used in file preview components        |

---

## What to avoid

- Do not bypass the API handler wrapper — missing auth/logging is a security hole.
- Do not call `new PrismaClient()` — use the singleton.
- Do not use `any` without a disable comment and a reason.
- Do not add `'use client'` to components that don't need it — it expands the client bundle.
- Do not commit secrets, `.env`, or `prisma/generated/`.
- Do not write raw SQL strings — Prisma only.
- Do not add feature flags, backwards-compat shims, or half-finished stubs — implement fully or don't implement.
- Do not add error handling for scenarios that can't happen — trust Prisma/Next.js guarantees at internal boundaries.
