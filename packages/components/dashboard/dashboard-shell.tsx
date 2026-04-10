'use client'

import { DashboardSidebar } from '@/packages/components/dashboard/dashboard-sidebar'

interface DashboardShellProps {
  children: React.ReactNode
  header?: React.ReactNode
}

export function DashboardShell({ children, header }: DashboardShellProps) {
  return (
    <div className="space-y-6">
      {header}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
        <nav className="lg:w-56 shrink-0">
          <DashboardSidebar />
        </nav>
        <div className="flex-1 min-w-0 space-y-6">
          {children}
        </div>
      </div>
    </div>
  )
}
