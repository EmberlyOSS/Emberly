'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/packages/hooks/use-toast'

interface BillingHistory {
  id: string
  type: string
  amountCents: number
  amountDollars?: number
  description: string | null
  createdAt: string
  relatedUser?: {
    id: string
    name: string | null
    email: string | null
  }
}

interface BillingData {
  transactions: BillingHistory[]
  pendingCredits: number
  stripeBalance: number
  totalBalance: number
}

export function BillingCreditsSection() {
  const { toast } = useToast()
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/profile/billing-history?limit=10')
      if (res.ok) {
        setData(await res.json())
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load billing data',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load billing data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-muted/30 dark:bg-black/5 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-border/50 dark:border-border/20">
      <div className="text-sm font-semibold">Billing Credits</div>

      {/* Credit Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.pendingCredits > 0 && (
          <div className="p-3 rounded-lg bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/10">
            <div className="text-xs text-muted-foreground">Pending Credits</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${data.pendingCredits.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Awaiting conversion to billing account
            </div>
          </div>
        )}

        {data.stripeBalance > 0 && (
          <div className="p-3 rounded-lg bg-green-500/10 dark:bg-green-500/5 border border-green-500/20 dark:border-green-500/10">
            <div className="text-xs text-muted-foreground">Available Credit</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${data.stripeBalance.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Applied to your next purchase
            </div>
          </div>
        )}

        {data.totalBalance === 0 && (
          <div className="p-3 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20 md:col-span-2">
            <div className="text-xs text-muted-foreground">Available Credit</div>
            <div className="text-2xl font-bold">$0.00</div>
            <div className="text-xs text-muted-foreground mt-1">
              Earn credits by referring friends
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {data.transactions.length > 0 && (
        <div className="mt-6">
          <div className="text-sm font-semibold mb-3">Recent Credit Activity</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-2 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20 flex items-center justify-between text-sm"
              >
                <div className="flex-1">
                  <div className="font-medium capitalize">
                    {tx.type === 'earned_referral' && '✓ Referral earned'}
                    {tx.type === 'applied_checkout' && '→ Applied to purchase'}
                    {tx.type === 'applied_purchase' && '→ Applied to purchase'}
                    {tx.type === 'manual_adjustment' && '⚙ Adjustment'}
                  </div>
                  {tx.description && (
                    <div className="text-xs text-muted-foreground">{tx.description}</div>
                  )}
                </div>
                <div className={`font-medium whitespace-nowrap ml-4 ${
                  tx.amountCents > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {tx.amountCents > 0 ? '+' : ''}{(tx.amountCents / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
