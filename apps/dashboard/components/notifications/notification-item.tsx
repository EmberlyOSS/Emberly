'use client'

import Link from 'next/link'

import { formatDistanceToNow } from 'date-fns'
import {
  CreditCard,
  Megaphone,
  ShieldAlert,
  Sparkles,
  User,
} from 'lucide-react'

import { cn } from '@/lib/utils'

export interface NotificationData {
  id: string
  category: string
  title: string
  body: string | null
  link: string | null
  readAt: string | null
  createdAt: string
}

export const CATEGORY_LABELS: Record<string, string> = {
  security: 'Security',
  account: 'Account',
  billing: 'Billing',
  productUpdates: 'Updates',
  marketing: 'News',
}

const CATEGORY_ICONS: Record<string, typeof User> = {
  security: ShieldAlert,
  account: User,
  billing: CreditCard,
  productUpdates: Sparkles,
  marketing: Megaphone,
}

export function NotificationItem({
  notification,
  onOpen,
  actions,
  compact = false,
}: {
  notification: NotificationData
  onOpen?: (notification: NotificationData) => void
  actions?: React.ReactNode
  compact?: boolean
}) {
  const Icon = CATEGORY_ICONS[notification.category] ?? User
  const unread = !notification.readAt
  const content = (
    <>
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          notification.category === 'security'
            ? 'bg-amber-500/10 text-amber-500'
            : 'bg-primary/10 text-primary'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm leading-snug',
            unread ? 'font-semibold' : 'text-muted-foreground'
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p
            className={cn(
              'mt-0.5 text-xs text-muted-foreground',
              compact && 'line-clamp-2'
            )}
          >
            {notification.body}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground/80">
          {CATEGORY_LABELS[notification.category] ?? 'Notice'} ·{' '}
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
      {unread && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </>
  )

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg p-3 transition-colors',
        unread ? 'bg-primary/[0.04]' : '',
        'hover:bg-muted/50'
      )}
    >
      {notification.link ? (
        <Link
          href={notification.link}
          onClick={() => onOpen?.(notification)}
          className="flex min-w-0 flex-1 items-start gap-3"
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => onOpen?.(notification)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          {content}
        </button>
      )}
      {actions}
    </div>
  )
}
