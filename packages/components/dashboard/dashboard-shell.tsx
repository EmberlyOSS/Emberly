'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  ChartBar,
  Clipboard,
  Database,
  FolderOpen,
  Globe,
  LayoutDashboard,
  LinkIcon,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react'

import { isCloudEnabledClient } from '@/packages/lib/config/env'
import { ScrollIndicator } from '@/packages/components/ui/scroll-indicator'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/files', label: 'Files', icon: FolderOpen },
  { href: '/dashboard/upload', label: 'Upload', icon: Upload },
  { href: '/dashboard/paste', label: 'Paste', icon: Clipboard },
  { href: '/dashboard/urls', label: 'Links', icon: LinkIcon },
  {
    href: '/dashboard/domains',
    label: 'Domains',
    icon: Globe,
    cloudOnly: true,
  },
  { href: '/dashboard/analytics', label: 'Analytics', icon: ChartBar },
  {
    href: '/dashboard/bucket',
    label: 'Buckets',
    icon: Database,
    cloudOnly: true,
  },
  {
    href: '/dashboard/discovery',
    label: 'Discovery',
    icon: Sparkles,
    cloudOnly: true,
  },
  { href: '/dashboard/squads', label: 'Squads', icon: Users, cloudOnly: true },
]

interface DashboardShellProps {
  children: React.ReactNode
  header?: React.ReactNode
}

export function DashboardShell({ children, header }: DashboardShellProps) {
  const pathname = usePathname()
  const cloudEnabled = isCloudEnabledClient()
  const visibleItems = navItems.filter(
    (item) => !item.cloudOnly || cloudEnabled
  )

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="space-y-6">
      {header}
      <ScrollIndicator className="glass-subtle rounded-xl p-1.5">
        <div className="flex gap-1 w-max">
          {visibleItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-all duration-150 ${
                  active
                    ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </ScrollIndicator>
      <div>{children}</div>
    </div>
  )
}
