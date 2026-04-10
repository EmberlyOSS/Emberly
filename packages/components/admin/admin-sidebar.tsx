'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

import {
  BookOpen,
  ChartBar,
  ClipboardList,
  CreditCard,
  Gavel,
  Handshake,
  Mail,
  MessageSquare,
  Settings,
  Shield,
  ShieldAlert,
  Users,
} from 'lucide-react'

import { ScrollIndicator } from '@/packages/components/ui/scroll-indicator'

const adminRoutes = [
  { href: '/admin', label: 'Overview', icon: Shield },
  { href: '/admin/blog', label: 'Blogs', icon: BookOpen },
  { href: '/admin/legal', label: 'Legal', icon: Gavel },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: ShieldAlert },
  { href: '/admin/applications', label: 'Applications', icon: ClipboardList },
  { href: '/admin/products', label: 'Products', icon: CreditCard },
  { href: '/admin/email', label: 'Email', icon: Mail, superAdminOnly: true },
  { href: '/admin/partners', label: 'Partners', icon: Handshake },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  { href: '/admin/logs', label: 'Audit Logs', icon: ChartBar, superAdminOnly: true },
  { href: '/admin/settings', label: 'Settings', icon: Settings, superAdminOnly: true },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'SUPERADMIN'

  const visibleRoutes = adminRoutes.filter(
    (r) => !('superAdminOnly' in r && r.superAdminOnly) || isSuperAdmin
  )

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav>
      {/* Mobile: horizontal scrollable tab strip */}
      <ScrollIndicator className="lg:hidden glass-subtle rounded-xl p-1.5">
        <div className="flex gap-1 w-max">
          {visibleRoutes.map((route) => {
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
        </div>
      </ScrollIndicator>

      {/* Desktop: vertical tab list */}
      <div className="hidden lg:block glass-subtle rounded-xl p-2 lg:sticky lg:top-28 space-y-0.5">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Administration
        </p>
        {visibleRoutes.map((route) => {
          const active = isActive(route.href)
          return (
            <Link
              key={route.href}
              href={route.href}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                active
                  ? 'bg-primary/10 text-primary font-medium shadow-sm border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <route.icon className={`h-4 w-4 shrink-0`} />
              {route.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
