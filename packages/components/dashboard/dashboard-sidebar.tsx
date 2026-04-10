'use client'

import { useState } from 'react'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import {
  Briefcase,
  ChartBar,
  ChevronDown,
  Clipboard,
  ClipboardList,
  Database,
  FolderOpen,
  Globe,
  LayoutDashboard,
  LinkIcon,
  Sparkles,
  Upload,
  User,
  Users,
  Zap,
} from 'lucide-react'

import { ScrollIndicator } from '@/packages/components/ui/scroll-indicator'

const dashboardRoutes = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/files', label: 'Files', icon: FolderOpen },
  { href: '/dashboard/upload', label: 'Upload', icon: Upload },
  { href: '/dashboard/paste', label: 'Paste', icon: Clipboard },
  { href: '/dashboard/urls', label: 'Links', icon: LinkIcon },
  { href: '/dashboard/domains', label: 'Domains', icon: Globe },
  { href: '/dashboard/analytics', label: 'Analytics', icon: ChartBar },
  { href: '/dashboard/bucket', label: 'Buckets', icon: Database },
]

const discoveryChildren = [
  { href: '/dashboard/discovery', label: 'Talent Profile', icon: User, params: '?tab=talent' },
  { href: '/dashboard/discovery', label: 'Squads', icon: Users, params: '?tab=squads' },
]

const talentSubLinks = [
  { label: 'Profile', icon: User, section: 'profile' },
  { label: 'Skills', icon: Sparkles, section: 'skills' },
  { label: 'Signals', icon: Zap, section: 'signals' },
  { label: 'Opportunities', icon: Briefcase, section: 'opportunities' },
  { label: 'Applications', icon: ClipboardList, section: 'applications' },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isOnDiscovery = pathname === '/dashboard/discovery' || pathname.startsWith('/dashboard/discovery/')
  const [discoveryOpen, setDiscoveryOpen] = useState(isOnDiscovery)

  const currentTab = searchParams.get('tab') ?? 'talent'
  const currentSection = searchParams.get('section') ?? 'profile'

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav>
      {/* Mobile: horizontal scrollable tab strip */}
      <ScrollIndicator className="lg:hidden glass-subtle rounded-xl p-1.5">
        <div className="flex gap-1 w-max">
          {dashboardRoutes.map((route) => {
            const active = isActive(route.href)
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg whitespace-nowrap transition-all duration-150 ${
                  active
                    ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <route.icon className="h-3.5 w-3.5 shrink-0" />
                {active && route.label}
              </Link>
            )
          })}
          {/* Discovery as expandable on mobile too */}
          <Link
            href="/dashboard/discovery"
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg whitespace-nowrap transition-all duration-150 ${
              isOnDiscovery
                ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            {isOnDiscovery && 'Discovery'}
          </Link>
        </div>
      </ScrollIndicator>

      {/* Desktop: vertical tab list */}
      <div className="hidden lg:block glass-subtle rounded-xl p-2 lg:sticky lg:top-28 space-y-0.5">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Dashboard
        </p>
        {dashboardRoutes.map((route) => {
          const active = isActive(route.href)
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                active
                  ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <route.icon className="h-4 w-4 shrink-0" />
              {route.label}
            </Link>
          )
        })}

        {/* Discovery — expandable */}
        <button
          type="button"
          onClick={() => setDiscoveryOpen((v) => !v)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
            isOnDiscovery
              ? 'bg-primary/10 text-primary font-medium border border-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 shrink-0" />
            Discovery
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              discoveryOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        {discoveryOpen && (
          <div className="space-y-0.5 pl-2 border-l border-border/40 ml-5">
            {discoveryChildren.map((child) => {
              const tabVal = child.params.replace('?tab=', '')
              const active = isOnDiscovery && currentTab === tabVal
              return (
                <Link
                  key={child.label}
                  href={`${child.href}${child.params}`}
                  className={`flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-lg transition-all duration-150 ${
                    active
                      ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <child.icon className="h-3.5 w-3.5 shrink-0" />
                  {child.label}
                </Link>
              )
            })}

            {/* Talent sub-sections when on talent tab */}
            {isOnDiscovery && currentTab === 'talent' && (
              <div className="space-y-0.5 pl-2 border-l border-border/40 ml-3 mt-1">
                {talentSubLinks.map((sub) => {
                  const active = currentSection === sub.section
                  return (
                    <Link
                      key={sub.section}
                      href={`/dashboard/discovery?tab=talent&section=${sub.section}`}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-all duration-150 ${
                        active
                          ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                    >
                      <sub.icon className="h-3 w-3 shrink-0" />
                      {sub.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
