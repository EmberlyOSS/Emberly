'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Share2, Loader2 } from 'lucide-react'
import { Button } from '@/packages/components/ui/button'
import { useToast } from '@/packages/hooks/use-toast'

interface ReferralStats {
  referralCode: string | null
  totalCredits: number
  referralCount: number
  creditedCount: number
  lastCreditedAt: string | null
}

interface ReferralHistory {
  id: string
  email: string | null
  name: string | null
  createdAt: string
}

export function ProfileReferrals() {
  const { toast } = useToast()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [history, setHistory] = useState<ReferralHistory[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customCode, setCustomCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [codeError, setCodeError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, historyRes] = await Promise.all([
        fetch('/api/profile/referrals?action=stats'),
        fetch('/api/profile/referrals?action=history'),
      ])

      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
      if (historyRes.ok) {
        setHistory(await historyRes.json())
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load referral data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setCodeError('')

    if (!customCode.trim()) {
      setCodeError('Please enter a referral code')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/profile/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: customCode }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create referral code')
      }

      const result = await res.json()
      setStats((prev) => prev ? { ...prev, referralCode: result.referralCode } : null)
      setCustomCode('')
      toast({
        title: 'Success!',
        description: 'Your referral code has been created',
      })
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : 'Failed to create code')
      toast({
        title: 'Error',
        description: codeError,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = async () => {
    if (!stats?.referralCode) return

    const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://embrly.ca'}/auth/register?ref=${stats.referralCode}`

    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard',
      })
    } catch (error) {
      console.error('Failed to copy:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      })
    }
  }

  const shareReferral = async () => {
    if (!stats?.referralCode) return

    const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://embrly.ca'}/auth/register?ref=${stats.referralCode}`
    const shareText = `Join Emberly and get $10 in billing credits! Use my referral link: ${referralUrl}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Emberly Referral',
          text: shareText,
          url: referralUrl,
        })
      } catch (error) {
        console.error('Failed to share:', error)
      }
    } else {
      // Fallback: copy to clipboard
      await copyToClipboard()
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 bg-white/5 dark:bg-black/5 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load referral data</p>
      </div>
    )
  }

  // Show form if no referral code exists
  if (!stats.referralCode) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Create Your Referral Code</h3>
          <p className="text-sm text-muted-foreground">
            Set a custom referral code to share with friends. When they sign up using your link, you both receive $10 in billing credits!
          </p>

          <form onSubmit={handleCreateCode} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="e.g., yourname, john-doe, jsmith123"
                value={customCode}
                onChange={(e) => {
                  setCustomCode(e.target.value)
                  setCodeError('')
                }}
                className="flex-1 px-3 py-2 rounded-lg bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 text-sm placeholder-muted-foreground/50 focus:outline-none focus:border-orange-500/50"
              />
              <Button
                type="submit"
                disabled={submitting || !customCode.trim()}
                className="gap-2 w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Code'
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="break-words">• 3-30 characters (letters, numbers, dashes, underscores)</p>
              <p className="break-words">• Example: my-name or username123</p>
            </div>

            {codeError && (
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                {codeError}
              </div>
            )}
          </form>
        </div>

        <div className="p-3 sm:p-4 rounded-lg bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/10">
          <div className="text-sm space-y-2">
            <div className="font-semibold text-blue-600 dark:text-blue-400">How Billing Credits Work</div>
            <ul className="space-y-1.5 text-muted-foreground text-xs ml-3 sm:ml-4 list-disc">
              <li className="break-words">Credits are automatically applied to your next purchase</li>
              <li className="break-words">They reduce the amount you owe on subscriptions or add-ons</li>
              <li className="break-words">Credits are applied at checkout before payment</li>
              <li className="break-words">Any remaining balance is charged to your payment method</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Your Referral Code</h3>
        <p className="text-sm text-muted-foreground">
          Share your unique referral code with friends. When they sign up using your link, you both receive $10 in billing credits!
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg">
          <code className="flex-1 text-base sm:text-lg font-mono font-bold text-orange-600 dark:text-orange-400 break-all">
            {stats.referralCode}
          </code>
          <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="gap-2 flex-1 sm:flex-none"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={shareReferral}
            className="gap-2 flex-1 sm:flex-none"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5">
          <div className="text-sm text-muted-foreground mb-1">Billing Credits</div>
          <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400 break-all">${stats.totalCredits.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.totalCredits > 0 ? 'Applied to next purchase' : 'Earned from referrals'}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5">
          <div className="text-sm text-muted-foreground mb-1">Total Referrals</div>
          <div className="text-3xl font-bold">{stats.referralCount}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Users who joined
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5">
          <div className="text-sm text-muted-foreground mb-1">Credited</div>
          <div className="text-3xl font-bold">{stats.creditedCount}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.lastCreditedAt 
              ? `Last on ${new Date(stats.lastCreditedAt).toLocaleDateString()}`
              : 'No credits yet'
            }
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="p-3 sm:p-4 rounded-lg bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/10">
        <div className="text-sm space-y-2">
          <div className="font-semibold text-blue-600 dark:text-blue-400">How Billing Credits Work</div>
          <ul className="space-y-1.5 text-muted-foreground text-xs ml-3 sm:ml-4 list-disc">
            <li className="break-words">Credits are automatically applied to your next purchase</li>
            <li className="break-words">They reduce the amount you owe on subscriptions or add-ons</li>
            <li className="break-words">Credits are applied at checkout before payment</li>
            <li className="break-words">Any remaining balance is charged to your payment method</li>
          </ul>
        </div>
      </div>

      {/* Referral History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Referral History</h3>
          <div className="space-y-2">
            {history.map((referral) => (
              <div
                key={referral.id}
                className="p-3 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{referral.name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">{referral.email}</div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {new Date(referral.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="p-6 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5 text-center">
          <p className="text-muted-foreground">
            No referrals yet. Share your code to start earning credits!
          </p>
        </div>
      )}
    </div>
  )
}

