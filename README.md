# Emberly Cloud

The official cloud hosted Emberly instance website and admin dashboard.

## About This Repository

This is **not** the self-hostable open-source distribution. This repository contains:

- **Marketing & Public Pages** — Homepage, pricing, documentation, blog, changelogs, and legal pages
- **Authenticated Dashboard** — User file management, analytics, profile settings, URL shortener, paste collaboration, and two-factor authentication
- **Admin Console** — Platform administration tools for managing users, settings, products, documentation, partners, testimonials, and audit logs
- **Cloud-Specific Features** — Stripe billing integration, transactional email system (Resend), analytics tracking, and hosted infrastructure configuration

## Self-Hosted Emberly

If you're looking to **self-host** Emberly on your own infrastructure:

→ **GitHub**: https://github.com/EmberlyOSS/Emberly (Open Source - COMING SOON)

The open-source repository provides the core Next.js application, API routes, database schema, and complete self-hosting deployment instructions.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js with JWT + 2FA (TOTP)
- **Styling**: Tailwind CSS + shadcn/ui
- **File Storage**: Multi-provider support (Local, S3)
- **Email**: Resend (transactional)
- **Payments**: Stripe
- **Deployment**: Optimized for Vercel/Docker

## Development

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun run build
```

## Contributing

This is the official Emberly Cloud instance maintained by the Emberly Team. For feature requests, bug reports, and discussions, please refer to the main project repository once it's public.
