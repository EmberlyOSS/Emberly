'use client'

import Link from 'next/link'
import {
  FolderOpen,
  Upload,
  Clipboard,
  Link as LinkIcon,
  Globe,
  ChartBar,
  Sparkles,
  Database,
  ArrowRight,
  HardDrive,
  Files,
  Link2,
} from 'lucide-react'

interface DashboardIndexProps {
  userName: string
  fileCount: number
  urlCount: number
  storageUsed: string
}

const quickActions = [
  {
    href: '/dashboard/files',
    label: 'Files',
    description: 'View and manage your uploaded files',
    icon: FolderOpen,
  },
  {
    href: '/dashboard/upload',
    label: 'Upload',
    description: 'Upload new files to your account',
    icon: Upload,
  },
  {
    href: '/dashboard/paste',
    label: 'Paste',
    description: 'Share code snippets with syntax highlighting',
    icon: Clipboard,
  },
  {
    href: '/dashboard/urls',
    label: 'Links',
    description: 'Shorten URLs and track their traffic',
    icon: LinkIcon,
  },
  {
    href: '/dashboard/domains',
    label: 'Domains',
    description: 'Connect your own domains to Emberly',
    icon: Globe,
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    description: 'View usage statistics for your uploads',
    icon: ChartBar,
  },
  {
    href: '/dashboard/discovery',
    label: 'Discovery',
    description: 'Manage your Nexium talent profile',
    icon: Sparkles,
  },
  {
    href: '/dashboard/bucket',
    label: 'Buckets',
    description: 'Access your S3-compatible storage',
    icon: Database,
  },
]

export function DashboardIndex({
  userName,
  fileCount,
  urlCount,
  storageUsed,
}: DashboardIndexProps) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Files className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{fileCount}</p>
            <p className="text-sm text-muted-foreground">Files uploaded</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{urlCount}</p>
            <p className="text-sm text-muted-foreground">Shortened links</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <HardDrive className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{storageUsed}</p>
            <p className="text-sm text-muted-foreground">Storage used</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group glass-card p-5 flex flex-col gap-3 border border-transparent hover:border-primary/20 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </div>
              <div>
                <p className="font-medium">{action.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
