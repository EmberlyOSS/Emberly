'use client'

import { useSession } from 'next-auth/react'
import {
  BookOpen,
  ChartBar,
  ClipboardList,
  CreditCard,
  Handshake,
  Mail,
  MessageSquare,
  Settings,
  Shield,
  ShieldAlert,
  Users,
} from 'lucide-react'

import {
  SectionShell,
  type SectionNavGroup,
  type SectionNavItem,
} from '@/components/layout/section-shell'
import { useFeatures } from '@/components/providers/features-provider'

type AdminItem = SectionNavItem & {
  cloudOnly?: boolean
  billingOnly?: boolean
  superAdminOnly?: boolean
}

const groups: Array<{ label?: string; items: AdminItem[] }> = [
  {
    items: [{ href: '/admin', label: 'Overview', icon: Shield }],
  },
  {
    label: 'Community',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/reports', label: 'Reports', icon: ShieldAlert },
      {
        href: '/admin/applications',
        label: 'Applications',
        icon: ClipboardList,
        cloudOnly: true,
      },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/blog', label: 'Blogs', icon: BookOpen, cloudOnly: true },
      {
        href: '/admin/partners',
        label: 'Partners',
        icon: Handshake,
        cloudOnly: true,
      },
      {
        href: '/admin/testimonials',
        label: 'Testimonials',
        icon: MessageSquare,
        cloudOnly: true,
      },
    ],
  },
  {
    label: 'Platform',
    items: [
      {
        href: '/admin/products',
        label: 'Products',
        icon: CreditCard,
        cloudOnly: true,
        billingOnly: true,
      },
      {
        href: '/admin/email',
        label: 'Email',
        icon: Mail,
        superAdminOnly: true,
        cloudOnly: true,
      },
      {
        href: '/admin/logs',
        label: 'Audit log',
        icon: ChartBar,
        superAdminOnly: true,
      },
      {
        href: '/admin/settings',
        label: 'Settings',
        icon: Settings,
        superAdminOnly: true,
      },
    ],
  },
]

interface AdminShellProps {
  children: React.ReactNode
  /** Page title shown above the content, with the active section's icon */
  title?: string
  description?: React.ReactNode
  /** Buttons etc. aligned to the right of the title */
  actions?: React.ReactNode
  /** Fully custom header, for pages that need more than a title */
  header?: React.ReactNode
}

export function AdminShell(props: AdminShellProps) {
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'SUPERADMIN'
  const { cloud: cloudEnabled, billing: billingEnabled } = useFeatures()

  const visibleGroups: SectionNavGroup[] = groups
    .map((g) => ({
      label: g.label,
      items: g.items.filter(
        (i) =>
          (!i.superAdminOnly || isSuperAdmin) &&
          (!i.cloudOnly || cloudEnabled) &&
          (!i.billingOnly || billingEnabled)
      ),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <SectionShell
      sectionLabel="Administration"
      groups={visibleGroups}
      {...props}
    />
  )
}
