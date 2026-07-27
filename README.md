# Emberly

Emberly is an open-source, self-hostable platform for modern file storage, sharing, and URL shortening. Run it yourself for a fast, private, self-contained instance, or point it at the hosted Emberly cloud for team collaboration, custom domains, and billing on top of the same codebase.

[![Build Checks](https://github.com/EmberlyOSS/Emberly/actions/workflows/build.yml/badge.svg)](https://github.com/EmberlyOSS/Emberly/actions/workflows/build.yml) [![CodeQL Advanced](https://github.com/EmberlyOSS/Emberly/actions/workflows/codeql.yml/badge.svg)](https://github.com/EmberlyOSS/Emberly/actions/workflows/codeql.yml) ![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/EmberlyOSS/Emberly?utm_source=oss&utm_medium=github&utm_campaign=EmberlyOSS%2FEmberly&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews) [![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FEmberlyOSS%2FEmberly.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2FEmberlyOSS%2FEmberly?ref=badge_shield&issueType=security)

## Features

Self-hosted instances get the full core platform below. The sections marked **Cloud** are specific to the hosted Emberly service and aren't part of a self-hosted deployment.

**File Storage & Sharing**

- S3-compatible or local object storage with configurable upload limits
- Secure file sharing with customizable access controls
- File organization, tagging, and search
- OCR-powered text extraction from uploaded images and documents
- URL shortening with redirect tracking
- Code snippet pastes with syntax highlighting

**Administrative Tools**

- User management dashboard with role-based permissions
- Content/user report review queue
- Configurable storage provider, upload limits, and registration controls
- Audit logs and system health monitoring
- Custom branding (site name, meta description, favicon, theme)

**Cloud — Team & Collaboration**

- Squad-based team workspaces with seat-based pricing
- Granular permission management (roles: `SUPPORT`, `DEVELOPER`, `MODERATOR`, `DESIGNER`, `STAFF`)
- Talent discovery profiles and opportunity boards (Nexium)

**Cloud — Domains & Billing**

- Custom domain support with annual registration
- Stripe-backed subscriptions, promo codes, and storage add-ons
- Verification badges, staff/partner applications, and ban-appeal workflows
- Service status page ([emberlystat.us](https://emberlystat.us))

## Quick Start

For contribution guidelines and detailed documentation see [CONTRIBUTING.md](CONTRIBUTING.md).

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh/) (recommended package manager)
- PostgreSQL 14+
- Redis 6+ (required — used for caching, rate limiting, and the job queue)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/EmberlyOSS/Emberly.git
cd Emberly

# Install dependencies
bun install

# Configure environment
cp .env.template .env
# Edit .env with your local configuration

# Initialize database
bun run db:generate
bun run db:migrate

# (Optional, cloud only) Seed subscription plans
bun run db:seed

# Start development server
bun dev
```

The application will be available at `http://localhost:3000`. The first time you visit it, you'll be walked through a setup wizard to create the initial admin account and configure storage.

This gives you a fully self-hosted instance out of the box — uploads, pastes, short URLs, and admin tools all work with no extra configuration. The cloud-only features listed above (team workspaces, custom domains, billing) are specific to the hosted Emberly service and aren't part of a standard self-hosted deployment.

In development, the event worker runs in-process automatically — no extra steps needed. See [Event Worker](#event-worker) for production deployment.

## Tech Stack

**Frontend & Framework**

- [Next.js 16](https://nextjs.org/) — React framework with App Router
- [React 19](https://react.dev/) — UI library
- [TypeScript](https://www.typescriptlang.org/) — strict-mode type safety
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) — accessible component library

**Backend & Database**

- [PostgreSQL](https://www.postgresql.org/) — relational database
- [Prisma ORM](https://www.prisma.io/) — database toolkit and migrations
- [Redis](https://redis.io/) + [BullMQ](https://docs.bullmq.io/) — caching, rate limiting, and background job queue
- [Stripe](https://stripe.com/) — payment processing (cloud only, not required to self-host)
- [Resend](https://resend.com/) or SMTP — transactional email delivery

**Infrastructure & Services**

- Local disk or S3-compatible object storage (AWS S3 / Vultr / Linode / OVHcloud) — file storage
- [NextAuth](https://next-auth.js.org/) — authentication (Discord OAuth, GitHub OAuth, credentials)
- [Sentry](https://sentry.io/) — error tracking and monitoring (optional)
- [VirusTotal](https://www.virustotal.com/) — file scanning on upload (optional)

**Development Tools**

- [Bun](https://bun.sh/) — runtime and package manager
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) — linting and formatting
- [Husky](https://typicode.github.io/husky/) + [commitlint](https://commitlint.js.org/) — git hooks and commit linting

## Project Structure

```
app/                        Next.js App Router pages and routes
  (main)/                   Core app pages (auth, dashboard, admin, user profiles)
  (marketing)/              Marketing/company pages (cloud only — hidden when self-hosted)
  (raw)/                    Raw file serving
  (shorturl)/               Short URL redirects
  api/                      ~180 REST API endpoints

packages/
  components/               React component library
    admin/                  Admin dashboard components
    dashboard/              User dashboard
    auth/                   Authentication UI
    file/                   File management UI
    pricing/                Pricing and plans
    ui/                     shadcn/ui base components
  hooks/                    Custom React hooks
    use-file-upload.tsx     File uploading with progress
    use-profile.ts          User profile data
    use-user-content.ts     User content queries
    use-file-actions.ts     File action handlers
  lib/                      Business logic and integrations
    api/                    API handler wrapper (auth, logging, errors)
    auth/                   NextAuth config and helpers
    events/                 BullMQ job queue — emit helpers and per-event handlers
    cache/                  Redis helpers
    storage/                S3 / Vultr integration
    emails/                 Email templates (Resend)
    stripe/                 Payment processing
    permissions/            RBAC permission helpers
    nexium/                 Team/squad system
    security/               Security utilities and rate limiting
    logger/                 Pino structured logging
  types/                    Shared TypeScript type definitions

prisma/
  schema.prisma             Database schema
  migrations/               Migration history

public/                     Static assets
scripts/                    Utility scripts (seed, media-kit, worker)
```

## Event Worker

Emberly uses [BullMQ](https://docs.bullmq.io/) (backed by Redis) to process background jobs: emails, audit logs, Discord notifications, file expiry, storage sync, and more.

### How it works

All API routes call `events.emit('some.event', payload)`, which pushes a job onto the `emberly-events` BullMQ queue. A worker process dequeues jobs and dispatches them to the registered handlers.

### Development

In development the worker runs **in-process** alongside the Next.js dev server — no extra setup needed beyond `REDIS_URL` in your `.env`.

You can also run it as a dedicated process:

```bash
bun run worker
```

The in-process worker is controlled by `EMBERLY_RUN_EVENT_WORKER`:

| Value   | Behaviour                                             |
| ------- | ----------------------------------------------------- |
| unset   | Auto-starts in development, **skipped in production** |
| `true`  | Always starts (useful for single-container deploys)   |
| `false` | Never starts (use standalone worker instead)          |

### Production

In production, run the worker as a **separate process** alongside the web server:

```bash
# web server
bun run start

# event worker (separate terminal / container)
bun run worker
```

#### Docker / container deployments

Use the same image with a different start command:

```dockerfile
# web container
CMD ["bun", "run", "start"]

# worker container
CMD ["bun", "run", "worker"]
```

Both need the same `REDIS_URL` and `DATABASE_URL`. The worker serves no HTTP traffic and does not need `PORT` or `NEXTAUTH_URL`.

#### Environment variables

| Variable             | Required | Description                                   |
| -------------------- | -------- | --------------------------------------------- |
| `REDIS_URL`          | Yes      | Redis connection string (`redis://host:6379`) |
| `DATABASE_URL`       | Yes      | PostgreSQL connection string                  |
| `WORKER_CONCURRENCY` | No       | Jobs processed in parallel (default: `10`)    |

Provider credentials (SMTP, Discord webhook, etc.) are stored in the database via **Admin → Integrations**, not in env.

#### systemd (bare-metal / VPS deployments)

Create a unit file at `/etc/systemd/system/emberly-worker.service`:

```ini
[Unit]
Description=Emberly Event Worker
After=network.target redis.service postgresql.service
Requires=redis.service

[Service]
Type=simple
User=emberly
WorkingDirectory=/opt/emberly
EnvironmentFile=/opt/emberly/.env
ExecStart=/usr/local/bin/bun run worker
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=emberly-worker

# Prevent the worker from using excessive resources
MemoryMax=512M
CPUQuota=80%

[Install]
WantedBy=multi-user.target
```

Then enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable emberly-worker
sudo systemctl start emberly-worker

# Check status and live logs
sudo systemctl status emberly-worker
sudo journalctl -u emberly-worker -f
```

The `EnvironmentFile` path should point to the same `.env` used by your web server. Make sure it contains at minimum `REDIS_URL` and `DATABASE_URL`.

To deploy a new version:

```bash
# Pull changes, then restart the worker
sudo systemctl restart emberly-worker
```

#### Scaling

Multiple worker instances can run simultaneously — BullMQ uses Redis atomic operations so each job is processed exactly once. Add more worker containers or systemd units to increase throughput.

### Monitoring

BullMQ exposes queue and job state via Redis. Any BullMQ-compatible dashboard (e.g. [Bull Board](https://github.com/felixmosh/bull-board)) can connect using:

- **Queue name:** `emberly-events`
- Completed jobs are retained for **24 hours**
- Failed jobs are retained for **7 days** and retried up to **3 times** with exponential backoff

---

## Contributing

We welcome contributions from the community. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines including:

- Development environment setup
- Code standards and conventions
- Pull request process
- Commit message format
- How to report issues
- Community channels and support

## Support

- **Discord** — [Join our server](https://discord.gg/36spBmzZVB) for real-time discussions
- **GitHub Discussions** — Ask questions and share ideas
- **Email** — [hey@embrly.ca](mailto:hey@embrly.ca) for support

## License

This project is licensed under the GNU Affero General Public License v3 (AGPL-3.0). See the [LICENSE](LICENSE) file for details.

## Code of Conduct

This project adheres to the Contributor Covenant Code of Conduct. By participating, you agree to uphold this code. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for the full text.

## Acknowledgments

Thank you to all [contributors](https://github.com/EmberlyOSS/Emberly/graphs/contributors) who have helped make Emberly possible, and to the [open-source projects](https://github.com/EmberlyOSS/Emberly/network/dependencies) that power it.

<a href="https://github.com/EmberlyOSS/Emberly/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=EmberlyOSS/Emberly" alt="Contributors" />
</a>
