import Link from 'next/link'

import { CheckCircle2, CircleAlert, Clock, XCircle } from 'lucide-react'

import PageShell from '@/components/layout/PageShell'
import { Button } from '@/components/ui/button'
import { buildPageMetadata } from '@/lib/embeds/metadata'

export const metadata = buildPageMetadata({
  title: 'Discord Linked Roles',
  description: 'Connect your Emberly account to claim roles in Discord.',
})

const STATES = {
  connected: {
    icon: CheckCircle2,
    tone: 'text-emerald-500',
    title: 'Connected',
    body: 'Your Emberly account is connected. Back in Discord, open the server menu → Linked Roles and claim the roles you qualify for.',
  },
  cancelled: {
    icon: XCircle,
    tone: 'text-muted-foreground',
    title: 'Connection cancelled',
    body: "You didn't authorize Discord, so nothing was changed. Try again whenever you're ready.",
  },
  expired: {
    icon: Clock,
    tone: 'text-amber-500',
    title: 'That link expired',
    body: 'Connecting has to be finished within a few minutes. Start again and it will work.',
  },
  unavailable: {
    icon: CircleAlert,
    tone: 'text-amber-500',
    title: "Linked roles aren't set up",
    body: "This Emberly instance isn't connected to a Discord application yet.",
  },
  error: {
    icon: CircleAlert,
    tone: 'text-destructive',
    title: 'Something went wrong',
    body: "Discord didn't accept the connection. Please try again in a moment.",
  },
} as const

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function LinkedRolesPage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const state = STATES[status as keyof typeof STATES] ?? STATES.error
  const Icon = state.icon
  const retry = status !== 'connected' && status !== 'unavailable'

  return (
    <PageShell title="Discord Linked Roles">
      <section className="glass-card mx-auto max-w-lg space-y-5 p-8 text-center">
        <Icon className={`mx-auto h-10 w-10 ${state.tone}`} />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {state.title}
          </h2>
          <p className="text-sm text-muted-foreground">{state.body}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Roles reflect your account when you connect. Connect again later to
          refresh them.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {retry && (
            <Button asChild>
              <a href="/api/discord/linked-roles">Try again</a>
            </Button>
          )}
          <Button asChild variant={retry ? 'outline' : 'default'}>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  )
}
