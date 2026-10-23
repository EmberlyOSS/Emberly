'use client'

import Link from 'next/link'

import { Github, Twitter } from 'lucide-react'
import { SiDiscord } from 'react-icons/si'

import { useFeatures } from '@/components/providers/features-provider'
import { DISCORD_INVITE_URL } from '@/lib/constants/site'
import StatusIndicator from '@/components/layout/StatusIndicator'
import { Icons } from '@/components/shared/icons'

interface FooterLink {
  href: string
  label: string
  external?: boolean
  billingOnly?: boolean
}

// Footer columns are cloud-only (they link to Emberly's own marketing pages)
const COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: 'Product',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/discovery', label: 'Discovery' },
      { href: '/leaderboard', label: 'Leaderboard' },
      { href: '/pricing', label: 'Pricing', billingOnly: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Blog' },
      { href: '/press', label: 'Press kit' },
      { href: '/applications', label: 'Applications' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: 'https://docs.embrly.ca', label: 'Docs', external: true },
      { href: '/changelogs', label: 'Changelog' },
      { href: '/discord', label: 'Community' },
      { href: '/legal', label: 'Legal' },
    ],
  },
]

const SOCIALS = [
  { href: 'https://github.com/EmberlyOSS', label: 'GitHub', icon: Github },
  {
    href: 'https://twitter.com/TryEmberly',
    label: 'Twitter / X',
    icon: Twitter,
  },
  { href: DISCORD_INVITE_URL, label: 'Discord', icon: SiDiscord },
]

export function Footer() {
  const { cloud: cloudEnabled, billing: billingEnabled } = useFeatures()

  return (
    <footer className="w-full px-4 pb-6 pt-10">
      <div className="mx-auto max-w-7xl">
        <div className="glass rounded-2xl px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
            <div className="max-w-xs space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <Icons.logo className="h-6 w-6" />
                <span className="emberly-text text-lg">Emberly</span>
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Open-source file sharing, short links and team collaboration.
              </p>
              <div className="flex gap-2">
                {SOCIALS.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {cloudEnabled && (
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                {COLUMNS.map((col) => (
                  <div key={col.title}>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                      {col.title}
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {col.links
                        .filter((l) => !l.billingOnly || billingEnabled)
                        .map((l) => (
                          <li key={l.href}>
                            <Link
                              href={l.href}
                              {...(l.external
                                ? {
                                    target: '_blank',
                                    rel: 'noopener noreferrer',
                                  }
                                : {})}
                              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {l.label}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} NodeByte LTD. All rights
              reserved.
            </p>
            <StatusIndicator />
          </div>
        </div>
      </div>
    </footer>
  )
}
