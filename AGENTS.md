# AGENTS.md

Context for AI coding assistants (Claude Code, Copilot, Cursor and so on) working in this repository.

## Project at a glance

Emberly is a self-hostable platform for file sharing, short links and pastes, plus the hosted service at embrly.ca.
This is a Turborepo monorepo using Bun workspaces. License: Elastic License 2.0.

| Path              | What it is                                                                               | Stack                                                             |
| ----------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `apps/dashboard`  | The Emberly app: dashboard, file pages, API, admin panel. The only app self-hosters run. | Next.js 16 App Router, React 19, Prisma, Redis/BullMQ, Tailwind 3 |
| `apps/docs`       | docs.embrly.ca                                                                           | Next.js 15, Fumadocs                                              |
| `apps/bot`        | Emberly Discord app (linked roles, levels, commands)                                     | discord.js 14, Prisma 5, own database                             |
| `apps/warden`     | Warden, the Discord moderation bot                                                       | Go, discordgo                                                     |
| `apps/status`     | Status page at emberlystat.us                                                            | Next.js, Prisma, own database                                     |
| `packages/db`     | Prisma schema, migrations and client for the dashboard                                   | Prisma 7 with the `pg` adapter                                    |
| `packages/config` | Shared tsconfig, Tailwind preset and Ember theme tokens                                  |                                                                   |
| `docker/`         | Dockerfiles, entrypoint, Dokploy template                                                |                                                                   |

## Commands

Run from the repository root.

```bash
bun install
bun run dev            # dashboard on http://localhost:3000
bun run dev:all        # every app
bun run typecheck      # all apps (Warden uses go vet)
bun run test
bun run build:all
bun run lint

bun run db:migrate     # create and apply a migration after editing packages/db/prisma/schema.prisma
bun run db:deploy      # apply migrations (production)
bun run db:generate    # regenerate the Prisma client
bun run db:studio
```

Run `bun run typecheck` before finishing. Type errors fail the production build.

## Dashboard layout (`apps/dashboard`)

```
app/
  (main)/          dashboard, admin, auth, setup, file pages at [userUrlId]/[filename]
  (marketing)/     public site pages, only shown in cloud mode
  (raw)/           raw file responses
  (shorturl)/      short link redirects
  api/             REST API
components/        React components (ui/ holds the shadcn/ui primitives)
hooks/             React hooks
lib/               server and shared logic
types/             shared TypeScript types
proxy.ts           request routing, auth gates, trailing slashes, bot embeds
scripts/           worker, plan seeding, license key tool
```

Imports use `@/` for the dashboard root (`@/lib/...`, `@/components/...`) and `@emberly/db` for the database.

## Conventions

### API routes

Authenticate with the helpers in `lib/auth/api-auth.ts` and respond with `lib/api/response.ts`:

```ts
import { apiError, apiResponse, HTTP_STATUS } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/api-auth'

export async function GET(req: Request) {
  const { user, response } = await requireAuth(req)
  if (response) return response
  return apiResponse({ id: user.id })
}
```

Use `requireAdmin` or `requireSuperAdmin` for admin routes. Never return secrets or password hashes in responses.

### Configuration and features

- Environment variables are read at runtime through `lib/config/env.ts` (`appUrl()`, `authSecret()`, `isCloudEnabled()`). Don't add new `NEXT_PUBLIC_*` variables: they are baked in at build time and break the shared Docker image.
- Instance settings edited in the admin panel live in the database, read with `getConfig()` from `lib/config`.
- Gate cloud-only or licensed behaviour through `getFeatures()` (`lib/features`) on the server and `useFeatures()` in client components. Cloud-only pages and API routes are also listed in `lib/middleware/constants.ts`, which `proxy.ts` enforces.
- License keys are verified offline in `lib/license`. Don't weaken or bypass these checks.
- Branding (site name, logo, credit) comes from `getBranding()` and `useBranding()`. Use `Icons.logo` and `<BrandName />` rather than hard-coding "Emberly" in self-hosted UI.

### Background jobs

Emit events with `events.emit(type, payload)` from `lib/events`. Handlers live in `lib/events/handlers/`, one file per domain. Event types are a discriminated union in `types/events.ts`. Jobs run in-process when `EMBERLY_RUN_EVENT_WORKER=true`, or in `bun run worker`.

Don't open Redis or BullMQ connections at import time. Create them lazily (see `getEventQueue()`), otherwise builds hang without Redis.

### Storage

Use `getStorageProvider()`, or `getProviderForStoredFile(file.storageBucketId)` for existing files, from `lib/storage`. Providers are local disk (under `DATA_DIR`) or S3-compatible. Never read or write upload paths with `fs` directly. Local paths go through `dataPath()`.

### Database

- Edit only `packages/db/prisma/schema.prisma`, then run `bun run db:migrate`. Never hand-edit migrations or use `db push` in production.
- Import `prisma` and model types from `@emberly/db`. Never create another `PrismaClient`.

### Style

- TypeScript strict mode. Prefer `unknown` and narrowing over `any`.
- Server components by default. Add `'use client'` only for hooks, events or browser APIs.
- Tailwind for styling, using the theme tokens (`bg-card`, `text-muted-foreground`, `text-primary` and so on).
- Comments only when the reason behind code isn't obvious.
- Files in `kebab-case`, components and types in `PascalCase`, functions and variables in `camelCase`.
- Commits follow Conventional Commits, scoped by app where it makes sense: `fix(dashboard): ...`.

## Security-sensitive areas

- `proxy.ts` and `lib/middleware/`: routing, auth gates, bot embed handling
- `lib/auth/`: NextAuth config, the session cookie (`session-cookie.ts`), 2FA
- `lib/security/`: rate limiting, password breach checks
- `lib/license/`: license verification
- Sanitize user HTML with DOMPurify before rendering. No raw SQL string interpolation.

## Things to avoid

- Committing `.env` files, generated Prisma clients or the license private key (it lives outside the repo).
- Hard-coding `https://embrly.ca`. Use `appUrl()`.
- Adding stubs or half-finished features.
