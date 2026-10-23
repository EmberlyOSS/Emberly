'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { BadgePercent, Copy, DollarSign, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface PublicPromoCode {
  id: string
  code: string
  percentOff: number | null
  amountOff: number | null
  currency: string | null
  maxRedemptions: number | null
  timesRedeemed: number
  expiresAt: number | null
}

export function DiscountsSection() {
  const [codes, setCodes] = useState<PublicPromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/payments/promo-codes')
      .then((r) => r.json())
      .then((data) => setCodes(Array.isArray(data) ? data : (data.data ?? [])))
      .catch(() => setCodes([]))
      .finally(() => setLoading(false))
  }, [])

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {})
    toast({ title: 'Copied!', description: `Use code ${code} at checkout.` })
  }

  const discountLabel = (pc: PublicPromoCode) => {
    if (pc.percentOff != null) return `${pc.percentOff}% off`
    if (pc.amountOff != null) {
      return `$${(pc.amountOff / 100).toFixed(2)} ${(pc.currency ?? 'USD').toUpperCase()} off`
    }
    return ''
  }

  const spotsLeft = (pc: PublicPromoCode) => {
    if (pc.maxRedemptions == null) return null
    const left = pc.maxRedemptions - pc.timesRedeemed
    return left
  }

  return (
    <section className="mt-10 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-primary/20">
          <Tag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Discounts</h2>
          <p className="text-sm text-muted-foreground">Active promo codes you can copy and apply at checkout.</p>
        </div>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse h-32" />
          ))}
        </div>
      )}

      {!loading && codes.length === 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-6">
            <p className="text-muted-foreground text-sm">No active promo codes at the moment. Check back soon!</p>
          </div>
        </div>
      )}

      {!loading && codes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {codes.map((pc) => {
            const left = spotsLeft(pc)
            return (
              <div key={pc.id} className="glass-card overflow-hidden">
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        {pc.percentOff != null
                          ? <BadgePercent className="h-4 w-4 text-primary" />
                          : <DollarSign className="h-4 w-4 text-primary" />}
                      </div>
                      <span className="font-bold text-lg text-primary">{discountLabel(pc)}</span>
                    </div>
                    {pc.expiresAt && (
                      <span className="text-xs text-muted-foreground">
                        Expires {format(new Date(pc.expiresAt * 1000), 'MMM d')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-sm font-semibold tracking-widest px-3 py-2 rounded-lg bg-muted/50 border border-border/40">
                      {pc.code}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copy(pc.code)}
                      className="shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy
                    </Button>
                  </div>

                  {left != null && (
                    <p className="text-xs text-muted-foreground">
                      {left > 0 ? `${left} use${left === 1 ? '' : 's'} remaining` : 'Fully redeemed'}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
