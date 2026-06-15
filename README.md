# Emberly

Emberly is an open-source platform for modern file storage, sharing, discovery, and identity verification. Build your digital presence with powerful tools for teams and individuals.

[![Build Checks](https://github.com/EmberlyOSS/Emberly/actions/workflows/build.yml/badge.svg)](https://github.com/EmberlyOSS/Emberly/actions/workflows/build.yml) [![CodeQL Advanced](https://github.com/EmberlyOSS/Emberly/actions/workflows/codeql.yml/badge.svg)](https://github.com/EmberlyOSS/Emberly/actions/workflows/codeql.yml) ![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/EmberlyOSS/Emberly?utm_source=oss&utm_medium=github&utm_campaign=EmberlyOSS%2FEmberly&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews) [![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FEmberlyOSS%2FEmberly.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2FEmberlyOSS%2FEmberly?ref=badge_shield&issueType=security)

## Features

**File Storage & Sharing**

- S3-compatible object storage with configurable upload limits
- Secure file sharing with customizable access controls
- File organization, tagging, and search
- OCR-powered text extraction from uploaded images and documents
- URL shortening with redirect tracking
- Bandwidth-efficient delivery through global infrastructure

**Domain & Branding**

- Custom domain support with annual registration
- Personal or team branded file-sharing pages
- Domain SSL certificate management
- DNS configuration assistance

**Identity & Verification**

- User verification badges with multiple tier options
- Verification queue with application review system
- Badge display on public profiles
- Organization verification for teams

**Team & Collaboration**

- Squad-based team subscriptions with seat-based pricing
- Granular permission management (roles: `SUPPORT`, `DEVELOPER`, `MODERATOR`, `DESIGNER`, `STAFF`)
- Team member invitations and management
- Shared storage pools with usage tracking

**Applications & Trust**

- Staff application system for organizational partnerships
- Partner program enrollment
- Verification badge applications
- Ban appeal process with review workflow
- Email notifications for all application updates

**Administrative Tools**

- Promo code management with configurable discounts
- User management dashboard
- Application review queue with multi-stage triage
- Service status page ([emberlystat.us](https://emberlystat.us))
- Analytics and usage reporting

## Quick Start

For contribution guidelines and detailed documentation see [CONTRIBUTING.md](CONTRIBUTING.md).

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh/) (recommended package manager)
- PostgreSQL 14+
- Redis 6+ (optional for caching and rate limiting)

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

# (Optional) Seed subscription plans
bun run db:seed

# Start development server
bun dev
```

The application will be available at `http://localhost:3000`.

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
- [Redis](https://redis.io/) — caching and rate limiting
- [Stripe](https://stripe.com/) — payment processing
- [Resend](https://resend.com/) — transactional email delivery

**Infrastructure & Services**

- S3-compatible object storage (AWS S3 / Vultr) — file storage
- [NextAuth](https://next-auth.js.org/) — authentication (Discord OAuth, GitHub OAuth, credentials)
- [Sentry](https://sentry.io/) — error tracking and monitoring
- [VirusTotal](https://www.virustotal.com/) — file scanning on upload

**Development Tools**

- [Bun](https://bun.sh/) — runtime and package manager
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) — linting and formatting
- [Husky](https://typicode.github.io/husky/) + [commitlint](https://commitlint.js.org/) — git hooks and commit linting

## Project Structure

```
app/                        Next.js App Router pages and routes
  (main)/                   Public user pages (auth, admin, user profiles)
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
    events/                 Event system (emitter, consumer, worker, handlers)
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
scripts/                    Utility scripts (seed, media-kit)
```

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
