'use client'

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

import {
  SectionShell,
  type SectionNavGroup,
  type SectionNavItem,
} from '@/packages/components/layout/section-shell'
import { useBillingEnabled } from '@/packages/components/providers/billing-provider'
import { isCloudEnabledClient } from '@/packages/lib/config/env'

type DashboardItem = SectionNavItem & {
  cloudOnly?: boolean
  billingOnly?: boolean
}

const groups: Array<{ label?: string; items: DashboardItem[] }> = [
  {
    items: [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    label: 'Content',
    items: [
      { href: '/dashboard/files', label: 'Files', icon: FolderOpen },
      { href: '/dashboard/upload', label: 'Upload', icon: Upload },
      { href: '/dashboard/paste', label: 'Paste', icon: Clipboard },
      { href: '/dashboard/urls', label: 'Links', icon: LinkIcon },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/dashboard/analytics', label: 'Analytics', icon: ChartBar },
      {
        href: '/dashboard/domains',
        label: 'Domains',
        icon: Globe,
        cloudOnly: true,
      },
      {
        href: '/dashboard/bucket',
        label: 'Buckets',
        icon: Database,
        cloudOnly: true,
        billingOnly: true,
      },
    ],
  },
  {
    label: 'Community',
    items: [
      {
        href: '/dashboard/discovery',
        label: 'Discovery',
        icon: Sparkles,
        cloudOnly: true,
      },
      {
        href: '/dashboard/squads',
        label: 'Squads',
        icon: Users,
        cloudOnly: true,
      },
    ],
  },
]

interface DashboardShellProps {
  children: React.ReactNode
  /** Page title shown above the content, with the active section's icon */
  title?: string
  description?: React.ReactNode
  /** Buttons etc. aligned to the right of the title */
  actions?: React.ReactNode
  /** Fully custom header, for pages that need more than a title */
  header?: React.ReactNode
}

export function DashboardShell(props: DashboardShellProps) {
  const cloudEnabled = isCloudEnabledClient()
  const billingEnabled = useBillingEnabled()

  const visibleGroups: SectionNavGroup[] = groups
    .map((g) => ({
      label: g.label,
      items: g.items.filter(
        (i) =>
          (!i.cloudOnly || cloudEnabled) && (!i.billingOnly || billingEnabled)
      ),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <SectionShell sectionLabel="Dashboard" groups={visibleGroups} {...props} />
  )
}
