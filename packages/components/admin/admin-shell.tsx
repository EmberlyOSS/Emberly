'use client'

import { AdminSidebar } from '@/packages/components/admin/admin-sidebar'

interface AdminShellProps {
  children: React.ReactNode
  header?: React.ReactNode
}

export function AdminShell({ children, header }: AdminShellProps) {
  return (
    <div className="space-y-6">
      {header}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
        <nav className="lg:w-56 shrink-0">
          <AdminSidebar />
        </nav>
        <div className="flex-1 min-w-0 space-y-6">
          {children}
        </div>
      </div>
    </div>
  )
}
