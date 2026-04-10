# Emberly

Emberly is an open source platform for modern file storage, sharing, and identity verification. Build your digital presence with powerful tools for teams and individuals.

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/EmberlyOSS/Emberly?utm_source=oss&utm_medium=github&utm_campaign=EmberlyOSS%2FEmberly&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Features

**File Storage & Sharing**
- S3 compatible object storage with configurable upload limits
- Secure file sharing with customizable access controls
- Real world file organization and management
- Bandwidth efficient delivery through global infrastructure

**Domain & Branding**
- Custom domain support with annual registration
- Personal or team branded file sharing pages
- Domain SSL certificate management
- DNS configuration assistance

**Identity & Verification**
- User verification badges with multiple tier options
- Verification queue with application review system
- Badge display on public profiles
- Organization verification for teams

**Team & Collaboration**
- Squad based team subscriptions with seat based pricing
- Granular permission management (roles: SUPPORT, DEVELOPER, MODERATOR, DESIGNER, STAFF)
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
- Application review queue with multi stage triage
- Service status monitoring via Kener integration
- Analytics and usage reporting

## Quick Start

For development setup, contribution guidelines, and detailed documentation, see [CONTRIBUTING.md](CONTRIBUTING.md).

### Prerequisites

- Node.js 18+ or later
- Bun package manager
- PostgreSQL 14+ database
- Redis 6+ (optional for caching)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/EmberlyOSS/Emberly.git
cd Emberly

# Install dependencies
bun install

# Configure environment
cp .env.template .env
# Edit .env with your configuration

# Initialize database
bun prisma generate
bun prisma migrate deploy

# Start development server
bun dev
```

The application will be available at http://localhost:3000.

## Tech Stack

**Frontend & Framework**
- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [React 19](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility first styling
- [shadcn/ui](https://ui.shadcn.com/) - Component library

**Backend & Database**
- [PostgreSQL](https://www.postgresql.org/) - Relational database
- [Prisma ORM](https://www.prisma.io/) - Database toolkit
- [Stripe](https://stripe.com/) - Payment processing
- [Resend](https://resend.com/) - Email delivery

**Infrastructure & Services**
- [S3 compatible storage](https://aws.amazon.com/s3/) - File storage
- [Kener](https://kener.ing/) - Status page monitoring
- [Next.js Auth](https://next-auth.js.org/) - Authentication
- [Sentry](https://sentry.io/) - Error tracking

**Development Tools**
- [Bun](https://bun.sh/) - Runtime and package manager
- [ESLint](https://eslint.org/) - Code linting
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate) - Database migrations

## Project Structure

```
app/                     # Next.js App Router pages and routes
  (main)/                # Public user pages
  (raw)/                 # Raw file serving
  (shorturl)/            # Short URL redirects
  api/                   # API endpoints

packages/
  components/            # React components
    - admin/             # Admin dashboard components
    - pricing/           # Pricing and plans
    - auth/              # Authentication UI
    - dashboard/         # User dashboard
    - ui/                # Base UI building blocks
  
  hooks/                 # Custom React hooks
    - use file upload     # File uploading
    - use profile         # User profile data
    - use user content    # User content queries
  
  lib/                   # Utility functions
    - api/               # API helpers
    - auth/              # Authentication utilities
    - cache/             # Caching logic
    - stripe/            # Stripe integration
  
  types/                 # TypeScript definitions

prisma/                  # Database schema and migrations
  - schema.prisma        # Prisma schema definition
  - migrations/          # Migration files

public/                  # Static assets
scripts/                 # Build and utility scripts
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

Get help and connect with the community:

- **Discord** - [Join our server](https://discord.gg/A8c58ScRCj) for realtime discussions
- **GitHub Discussions** - Ask questions and share ideas
- **Email** - Contact [hey@embrly.ca](mailto:hey@embrly.ca) for support

## License

This project is licensed under the GNU Affero General Public License v3 (AGPL-3.0). See the [LICENSE](LICENSE) file for details.

## Code of Conduct

This project adheres to the Contributor Covenant Code of Conduct. By participating, you agree to uphold this code. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for the full text.

## Acknowledgments

Thank you to all [contributors](https://github.com/EmberlyOSS/Emberly/graphs/contributors) who have helped make Emberly possible. We also appreciate the open source projects and communities that make this platform possible. 