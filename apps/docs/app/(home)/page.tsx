import Link from 'next/link';
import {
  Rocket,
  BookUser,
  Plug,
  Braces,
  Shield,
  Server,
  Users,
  ArrowRight,
} from 'lucide-react';

const sections = [
  {
    title: 'Getting Started',
    description: 'Create your account and upload your first file in minutes.',
    href: '/docs/getting-started',
    label: 'Start here',
    icon: Rocket,
    color: 'var(--getting-started-color)',
  },
  {
    title: 'User Guide',
    description: 'Manage files, domains, teams, and account settings.',
    href: '/docs/user-guide',
    label: 'Explore',
    icon: BookUser,
    color: 'var(--user-guide-color)',
  },
  {
    title: 'Integrations',
    description: 'Connect ShareX, Flicker, Flameshot, PowerShell, Python, and more.',
    href: '/docs/integrations',
    label: 'View integrations',
    icon: Plug,
    color: 'var(--integrations-color)',
  },
  {
    title: 'API Reference',
    description: 'Complete REST API documentation for files, domains, and account management.',
    href: '/docs/api',
    label: 'API docs',
    icon: Braces,
    color: 'var(--api-color)',
  },
  {
    title: 'Security',
    description: 'VirusTotal scanning, HIBP checks, password protection, and encryption.',
    href: '/docs/security',
    label: 'Security docs',
    icon: Shield,
    color: 'var(--security-color)',
  },
  {
    title: 'Self-Hosting',
    description: 'Deploy your own Emberly instance on any infrastructure.',
    href: '/docs/self-hosting',
    label: 'Self-host',
    icon: Server,
    color: 'var(--self-hosting-color)',
  },
  {
    title: 'Staff & Operations',
    description: 'Moderation, support, and incident response for the Emberly team.',
    href: '/docs/staff',
    label: 'Staff docs',
    icon: Users,
    color: 'var(--staff-color)',
  },
];

const quickLinks = [
  { label: 'Plans & Pricing', href: '/docs/getting-started/plans-overview' },
  { label: 'Feature Matrix', href: '/docs/getting-started/feature-matrix' },
  { label: 'Teams & Squads', href: '/docs/user-guide/teams-and-squads' },
  { label: 'Flicker Desktop App', href: '/docs/integrations/flicker' },
  { label: 'Webhooks', href: '/docs/integrations/webhooks' },
  { label: 'Billing API', href: '/docs/api/billing' },
  { label: 'Contributing', href: '/docs/self-hosting/contributing' },
];

export default function HomePage() {
  return (
    <main className="relative flex flex-col flex-1 w-full max-w-6xl px-4 py-20 mx-auto overflow-hidden">
      <div className="hero-glow" aria-hidden="true" />

      {/* Hero */}
      <div className="mb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium tracking-wide uppercase border rounded-full border-fd-border text-fd-muted-foreground bg-fd-card">
          Open Source & Self-hostable File Sharing
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl text-fd-foreground">
          Emberly{' '}
          <span className="text-transparent bg-gradient-to-r from-fd-primary to-fd-primary/60 bg-clip-text">
            Documentation
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg leading-relaxed text-fd-muted-foreground">
          Everything you need to upload, share, and manage files from quick screenshots to
          large documents with custom domains, teams, and full API access.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link
            href="/docs/getting-started"
            className="glow-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Get Started
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs/api"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-fd-border text-fd-foreground font-medium text-sm hover:bg-fd-accent transition-colors"
          >
            API Reference
          </Link>
        </div>
      </div>

      {/* Section grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="relative flex flex-col gap-4 p-5 overflow-hidden transition-all border group rounded-xl border-fd-border bg-fd-card hover:border-fd-ring hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className="inline-flex items-center justify-center rounded-lg size-10 shrink-0"
                style={{
                  color: s.color,
                  backgroundColor: `color-mix(in srgb, ${s.color} 15%, transparent)`,
                }}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex-1">
                <span className="block text-base font-semibold transition-colors text-fd-foreground group-hover:text-fd-primary">
                  {s.title}
                </span>
                <span className="block mt-1 text-sm leading-relaxed text-fd-muted-foreground">
                  {s.description}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium transition-colors text-fd-muted-foreground group-hover:text-fd-primary">
                {s.label}
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Quick links row */}
      <div className="pt-8 border-t mt-14 border-fd-border">
        <p className="mb-4 text-xs font-medium tracking-wide uppercase text-fd-muted-foreground">
          Quick links
        </p>
        <div className="flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm rounded-md border border-fd-border text-fd-muted-foreground hover:text-fd-foreground hover:border-fd-ring transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Footer nudge */}
      <p className="mt-10 text-sm text-center text-fd-muted-foreground">
        Something missing?{' '}
        <a
          href="https://github.com/EmberlyOSS/Documentation/issues"
          className="underline transition-colors underline-offset-2 hover:text-fd-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open an issue on GitHub
        </a>
      </p>
    </main>
  );
}
