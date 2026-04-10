'use client'

import Link from 'next/link'
import {
  Users,
  Files,
  ShieldAlert,
  ClipboardList,
  ArrowRight,
  BookOpen,
  Gavel,
  CreditCard,
  Handshake,
  MessageSquare,
  Mail,
  ChartBar,
  Settings,
} from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'

interface AdminOverviewProps {
  userCount: number
  fileCount: number
  pendingReports: number
  pendingApplications: number
  isSuperAdmin: boolean
}

const adminSections = [
  { href: '/admin/blog', label: 'Blogs', description: 'Publish and curate blog posts', icon: BookOpen },
  { href: '/admin/legal', label: 'Legal', description: 'Manage policies and legal documents', icon: Gavel },
  { href: '/admin/users', label: 'Users', description: 'Manage user accounts and roles', icon: Users },
  { href: '/admin/reports', label: 'Reports', description: 'Review user and content reports', icon: ShieldAlert },
  { href: '/admin/applications', label: 'Applications', description: 'Review user applications', icon: ClipboardList },
  { href: '/admin/products', label: 'Products', description: 'Manage plan products and pricing', icon: CreditCard },
  { href: '/admin/partners', label: 'Partners', description: 'Manage partner entries', icon: Handshake },
  { href: '/admin/testimonials', label: 'Testimonials', description: 'Manage user testimonials', icon: MessageSquare },
]

const superAdminSections = [
  { href: '/admin/email', label: 'Email', description: 'Send broadcasts and announcements', icon: Mail },
  { href: '/admin/logs', label: 'Audit Logs', description: 'Review system events and actions', icon: ChartBar },
  { href: '/admin/settings', label: 'Settings', description: 'Configure platform-wide settings', icon: Settings },
]

export function AdminOverviewContent({
  userCount,
  fileCount,
  pendingReports,
  pendingApplications,
  isSuperAdmin,
}: AdminOverviewProps) {
  const sections = isSuperAdmin
    ? [...adminSections, ...superAdminSections]
    : adminSections

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{userCount}</p>
            <p className="text-sm text-muted-foreground">Total users</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Files className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{fileCount}</p>
            <p className="text-sm text-muted-foreground">Total files</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{pendingReports}</p>
            <p className="text-sm text-muted-foreground">Pending reports</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{pendingApplications}</p>
            <p className="text-sm text-muted-foreground">Pending applications</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Manage</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group glass-card p-5 flex flex-col gap-3 border border-transparent hover:border-primary/20 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </div>
              <div>
                <p className="font-medium">{section.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {section.description}
                </p>
              </div>
              {section.href === '/admin/reports' && pendingReports > 0 && (
                <Badge variant="secondary" className="w-fit">
                  {pendingReports} pending
                </Badge>
              )}
              {section.href === '/admin/applications' && pendingApplications > 0 && (
                <Badge variant="secondary" className="w-fit">
                  {pendingApplications} pending
                </Badge>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
