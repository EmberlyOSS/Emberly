'use client'

import { useEffect, useState } from 'react'
import { CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react'
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

interface PaymentMethod {
  id: string
  brand: string | null
  last4: string | null
  expMonth: number | null
  expYear: number | null
  isDefault: boolean
}

interface StripeSubscription {
  id: string
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  interval: string | null
  amount: number
  currency: string | null
  productName: string
}

interface BillingData {
  transactions: BillingHistory[]
  pendingCredits: number
  stripeBalance: number
  totalBalance: number
  paymentMethods: PaymentMethod[]
  stripeSubscriptions: StripeSubscription[]
}

const CARD_BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  diners: 'Diners Club',
}

function statusBadge(status: string, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd) return { label: 'Cancels at period end', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' }
  switch (status) {
    case 'active': return { label: 'Active', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' }
    case 'trialing': return { label: 'Trial', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
    case 'past_due': return { label: 'Past due', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' }
    case 'canceled': return { label: 'Cancelled', className: 'bg-muted/50 text-muted-foreground border-border/50' }
    default: return { label: status, className: 'bg-muted/50 text-muted-foreground border-border/50' }
  }
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
        toast({ title: 'Error', description: 'Failed to load billing data', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error)
      toast({ title: 'Error', description: 'Failed to load billing data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 mt-4 pt-4 border-t border-border/50 dark:border-border/20">
        <div className="h-6 w-32 bg-muted/30 rounded animate-pulse" />
        <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6 mt-4 pt-4 border-t border-border/50 dark:border-border/20">

      {/* Payment Methods */}
      <div>
        <div className="text-sm font-semibold mb-3">Payment Methods</div>
        {data.paymentMethods.length === 0 ? (
          <div className="p-3 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20 text-sm text-muted-foreground">
            No payment methods on file. Add one via <strong>Manage Billing</strong>.
          </div>
        ) : (
          <div className="space-y-2">
            {data.paymentMethods.map((pm) => (
              <div key={pm.id} className="p-3 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20 flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 text-sm">
                  <span className="font-medium">{CARD_BRAND_LABELS[pm.brand ?? ''] ?? pm.brand ?? 'Card'}</span>
                  <span className="text-muted-foreground"> •••• {pm.last4}</span>
                  <span className="text-muted-foreground ml-2">Expires {pm.expMonth}/{pm.expYear}</span>
                </div>
                {pm.isDefault && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Default</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stripe Subscriptions */}
      {data.stripeSubscriptions.length > 0 && (
        <div>
          <div className="text-sm font-semibold mb-3">Subscriptions</div>
          <div className="space-y-2">
            {data.stripeSubscriptions.map((sub) => {
              const badge = statusBadge(sub.status, sub.cancelAtPeriodEnd)
              return (
                <div key={sub.id} className="p-3 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{sub.productName}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.className}`}>{badge.label}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>${sub.amount.toFixed(2)} {sub.currency}{sub.interval ? ` / ${sub.interval}` : ''}</span>
                    <span>{sub.cancelAtPeriodEnd ? 'Ends' : 'Renews'} {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Billing Credits */}
      <div>
        <div className="text-sm font-semibold mb-3">Billing Credits</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.pendingCredits > 0 && (
            <div className="p-3 rounded-lg bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/10">
              <div className="text-xs text-muted-foreground">Pending Credits</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">${data.pendingCredits.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">Applied automatically at checkout</div>
            </div>
          )}
          <div className={`p-3 rounded-lg border ${data.stripeBalance > 0 ? 'bg-green-500/10 dark:bg-green-500/5 border-green-500/20 dark:border-green-500/10' : 'bg-muted/30 dark:bg-black/5 border-border/50 dark:border-border/20'} ${data.pendingCredits === 0 ? 'md:col-span-2' : ''}`}>
            <div className="text-xs text-muted-foreground">Available Credit</div>
            <div className={`text-2xl font-bold ${data.stripeBalance > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>${data.stripeBalance.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.stripeBalance > 0 ? 'Applied to your next purchase' : 'Earn credits by referring friends'}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {data.transactions.length > 0 && (
        <div>
          <div className="text-sm font-semibold mb-3">Recent Credit Activity</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-2 rounded-lg bg-muted/30 dark:bg-black/5 border border-border/50 dark:border-border/20 flex items-center justify-between text-sm"
              >
                <div className="flex-1">
                  <div className="font-medium">
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
