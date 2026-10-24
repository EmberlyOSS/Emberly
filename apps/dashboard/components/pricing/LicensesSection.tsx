'use client'

import { useState } from 'react'

import { Check, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'

type IntervalKey = 'month' | 'quarter' | 'year'

export interface LicensePlan {
  slug: string
  name: string
  description: string
  highlights: string[]
  popular: boolean
  currency: string
  prices: Partial<Record<IntervalKey, number>>
}

const INTERVALS: Record<
  IntervalKey,
  { label: string; per: string; months: number }
> = {
  month: { label: 'Monthly', per: 'month', months: 1 },
  quarter: { label: 'Quarterly', per: '3 months', months: 3 },
  year: { label: 'Yearly', per: 'year', months: 12 },
}

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)

export default function LicensesSection({
  plans,
  buyUrl,
}: {
  plans: LicensePlan[]
  buyUrl: string
}) {
  const offered = (Object.keys(INTERVALS) as IntervalKey[]).filter((i) =>
    plans.some((p) => p.prices[i])
  )
  const [interval, setInterval] = useState<IntervalKey>(
    offered.includes('year') ? 'year' : (offered[0] ?? 'year')
  )

  if (plans.length === 0) {
    return (
      <div className="mt-10 glass-card p-8 text-center">
        <p className="font-medium">Self-hosting licenses</p>
        <p className="mt-1 text-sm text-muted-foreground">
          White-label Emberly or host it for your own customers.
        </p>
        <Button asChild className="mt-4">
          <a href={buyUrl}>See licenses</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-10 space-y-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div>
          <h3 className="text-lg font-semibold">
            Run Emberly on your own server
          </h3>
          <p className="text-sm text-muted-foreground">
            Emberly is free to self-host. A license adds your own branding, or
            lets you host it for your customers.
          </p>
        </div>
        {offered.length > 1 && (
          <div className="inline-flex rounded-xl bg-muted/50 p-1">
            {offered.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInterval(i)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  interval === i
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {INTERVALS[i].label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const amount = plan.prices[interval]
          const monthly = plan.prices.month
          const saving =
            amount && monthly && interval !== 'month'
              ? Math.round(
                  (1 - amount / (monthly * INTERVALS[interval].months)) * 100
                )
              : 0
          return (
            <div
              key={plan.slug}
              className={`glass-card flex flex-col p-6 ${plan.popular ? 'ring-1 ring-primary/50' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-xl font-semibold">{plan.name}</h4>
                {plan.popular && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                    Popular
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <p className="mt-5 text-3xl font-bold">
                {amount ? money(amount, plan.currency) : 'Not available'}
                {amount && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    / {INTERVALS[interval].per}
                  </span>
                )}
              </p>
              {saving > 0 && (
                <p className="mt-1 text-sm text-emerald-500">
                  Save {saving}% compared to monthly
                </p>
              )}
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {h}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" disabled={!amount}>
                <a href={buyUrl}>
                  Get {plan.name}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
