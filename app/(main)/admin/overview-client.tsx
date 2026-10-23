'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  ClipboardList,
  Files,
  ShieldAlert,
  Users,
} from 'lucide-react'

import { SystemHealthPanel } from '@/packages/components/admin/system-health'

interface AdminOverviewProps {
  userCount: number
  fileCount: number
  pendingReports: number
  pendingApplications: number
  isSuperAdmin: boolean
  cloudEnabled: boolean
}

function Stat({
  href,
  icon: Icon,
  label,
  value,
  attention = false,
}: {
  href?: string
  icon: React.ElementType
  label: string
  value: number
  /** Highlight when the count needs someone's attention */
  attention?: boolean
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon
          className={`h-4 w-4 ${attention ? 'text-primary' : 'text-muted-foreground'}`}
        />
      </div>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {value.toLocaleString()}
        </p>
        {href && (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
    </>
  )
  const cls = `glass-card p-5 ${attention ? 'border-primary/40' : ''}`
  return href ? (
    <Link href={href} className={`group ${cls} glass-hover`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export function AdminOverviewContent({
  userCount,
  fileCount,
  pendingReports,
  pendingApplications,
  cloudEnabled,
}: AdminOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          href="/admin/users"
          icon={Users}
          label="Users"
          value={userCount}
        />
        <Stat icon={Files} label="Files" value={fileCount} />
        <Stat
          href="/admin/reports"
          icon={ShieldAlert}
          label="Pending reports"
          value={pendingReports}
          attention={pendingReports > 0}
        />
        {cloudEnabled && (
          <Stat
            href="/admin/applications?status=PENDING"
            icon={ClipboardList}
            label="Pending applications"
            value={pendingApplications}
            attention={pendingApplications > 0}
          />
        )}
      </div>

      <SystemHealthPanel />
    </div>
  )
}
