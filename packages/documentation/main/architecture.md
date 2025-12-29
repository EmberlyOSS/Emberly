# Architecture

High-level map of the Emberly stack and where to look in this repo.

## Stack
- Next.js App Router (`app/`) with server components and API routes under `app/api/*`.
- PostgreSQL with Prisma (`prisma/schema.prisma`, `packages/lib/database/prisma.ts`).
- Auth via NextAuth (`app/api/auth/[...nextauth]`). Sessions for browser flows; some APIs also accept upload tokens.
- Storage providers: S3-compatible or local filesystem, configured in the DB-backed config (see below).
- Email via Resend (`packages/lib/emails`).
- Payments via Stripe (`app/api/stripe`, `app/api/payments`).
- Custom domains via Cloudflare SSL for SaaS (`packages/lib/cloudflare`, `app/api/domains`).

## Code layout
- `app/(main)/*` – primary UI (dashboard, docs, pricing, etc.).
- `app/(raw)` and `app/(shorturl)` – raw file serving and short-link redirects.
- `packages/components` – shared UI components and layouts (e.g., `layout/PageShell`).
- `packages/hooks` – React hooks for data fetching and UX helpers.
- `packages/lib` – backend helpers: auth, files, storage providers, config, embeds, events, logging.
- `packages/documentation` – markdown fallbacks for `/docs` when DB docs are absent.

## Configuration
Runtime settings are stored in the `Config` table and loaded via `getConfig()` (`packages/lib/config`). Keys include:
- Storage: provider (`local` or `s3`), bucket/region/credentials, optional endpoint, path-style toggle, quotas, max upload size.
- Registrations: enable/disable signups and message.
- Appearance: theme, favicon, and custom colors.
- Advanced: custom CSS/head snippets.

## Data model (high level)
- Users, accounts, sessions (NextAuth), profiles.
- Files and storage objects (visibility, password, expiration, view/download counts).
- Short URLs and analytics events.
- Custom domains (Cloudflare status, backoff, metadata).
- Blog posts, changelogs, testimonials, partners.
- Doc pages (optional DB-backed docs; markdown fallback is used when unpublished).

## Request flow
1. Client UI (dashboard) calls `app/api/*` routes.
2. Routes delegate to `packages/lib/*` utilities (auth, storage, cloudflare, etc.).
3. Prisma persists data; storage provider streams or signs objects.
4. Responses are rendered via shared UI components and hooks for caching/state.

## Observability & ops
- Logging via `packages/lib/logger` (pino). Cloudflare/logging errors are normalized for operators.
- Health endpoint at `/api/health`.
- Docs serve from DB first, then markdown; unpublished docs return 404.
