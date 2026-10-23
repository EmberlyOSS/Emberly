'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Globe,
  Plus,
  Search,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { SiCloudflare } from 'react-icons/si'

import { Icons } from '@/components/shared/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TooltipProvider } from '@/components/ui/tooltip'

import { useToast } from '@/hooks/use-toast'
import { useFeatures } from '@/components/providers/features-provider'

import DomainList from './DomainList'
import type { Domain } from './types'

export function ProfileDomains() {
  const { billing: billingEnabled } = useFeatures()
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')

  const [cfCheckingIds, setCfCheckingIds] = useState<string[]>([])
  const cfPollingRef = useRef<Record<string, { count: number; last: number }>>(
    {}
  )
  const [newDomain, setNewDomain] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [domainLimit, setDomainLimit] = useState<{
    allowed: number | null
    base: number | null
    purchased: number
    used: number
    remaining: number | null
    unlimited: boolean
  } | null>(null)
  const { toast } = useToast()
  const [openAdd, setOpenAdd] = useState(false)

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/domains')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setDomains(data.domains || [])
      setDomainLimit(data.domainLimit || null)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Could not load domains',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDomains()
  }, [])

  const addDomain = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newDomain.trim()) return

    setAdding(true)
    setError(null)

    if (
      domainLimit &&
      domainLimit.unlimited !== true &&
      (domainLimit.remaining ?? 1) <= 0
    ) {
      setError(
        billingEnabled
          ? 'Domain limit reached. Upgrade your plan to add more domains.'
          : 'Domain limit reached. Request more slots from the Applications page.'
      )
      setAdding(false)
      return
    }

    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim().toLowerCase() }),
      })

      if (res.status === 409) {
        setError('This domain is already registered')
        setAdding(false)
        return
      }

      if (!res.ok) throw new Error('Failed to add domain')

      toast({
        title: 'Domain added',
        description: 'Configure your DNS records to verify ownership.',
      })

      setNewDomain('')
      setOpenAdd(false)
      await fetchDomains()
    } catch (err) {
      setError('Failed to add domain. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const removeDomain = async (id: string) => {
    try {
      const res = await fetch(`/api/domains/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({
        title: 'Domain removed',
        description: 'The domain has been deleted.',
      })
      await fetchDomains()
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: 'Could not delete domain',
        variant: 'destructive',
      })
    }
  }

  const setPrimary = async (id: string) => {
    try {
      const res = await fetch(`/api/domains/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setPrimary' }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({
        title: 'Primary domain set',
        description: 'Your default domain has been updated.',
      })
      await fetchDomains()
    } catch (err) {
      toast({
        title: 'Failed',
        description: 'Could not set primary domain',
        variant: 'destructive',
      })
    }
  }

  const recheckCloudflare = async (id: string) => {
    try {
      setCfCheckingIds((s) => (s.includes(id) ? s : [...s, id]))
      const res = await fetch(`/api/domains/${id}/cf-check`, { method: 'POST' })

      if (res.status === 202) {
        toast({
          title: 'Verification in progress',
          description: 'Cloudflare is processing your domain.',
        })
        await fetchDomains()
        return
      }

      const data = await res.json().catch(() => null)
      if (res.ok) {
        if (
          data?.status &&
          String(data.status).toLowerCase().includes('active')
        ) {
          toast({
            title: 'Domain verified!',
            description: 'Your domain is now active and ready to use.',
          })
        } else {
          toast({
            title: 'Status updated',
            description: 'Domain status has been refreshed.',
          })
        }
        await fetchDomains()
        return
      }

      // Handle 400: Domain not in configured zone
      if (res.status === 400) {
        const msg =
          data?.message || 'Domain configuration issue - please contact support'
        toast({
          title: 'Configuration error',
          description: msg,
          variant: 'destructive',
        })
        return
      }

      // Handle 409: CNAME not configured
      if (res.status === 409) {
        const hint =
          data?.hint || data?.message || 'Please add the required CNAME record'
        toast({
          title: 'CNAME not configured',
          description: hint,
          variant: 'destructive',
        })
        return
      }

      // Handle Cloudflare validation errors
      if (
        data?.verification_errors &&
        Array.isArray(data.verification_errors)
      ) {
        const errors = data.verification_errors.join('; ')
        toast({
          title: 'Cloudflare validation failed',
          description: errors,
          variant: 'destructive',
        })
        return
      }

      const msg = data?.suggestion || data?.error || 'Verification check failed'
      toast({
        title: 'Verification issue',
        description: String(msg),
        variant: 'destructive',
      })
    } catch (err) {
      toast({
        title: 'Check failed',
        description: 'Could not verify domain status',
        variant: 'destructive',
      })
    } finally {
      setCfCheckingIds((s) => s.filter((x) => x !== id))
    }
  }

  // Auto-polling for pending domains
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now()
      for (const d of domains) {
        if (
          d.verified ||
          d.cfStatus === 'active' ||
          d.cfStatus === 'unsupported'
        )
          continue

        const state = cfPollingRef.current[d.id] ?? { count: 0, last: 0 }
        const attemptCount = state.count || 0
        const delay = 5000 * Math.pow(2, Math.min(attemptCount, 5))

        if (now - (state.last || 0) < delay) continue
        if (attemptCount >= 6) continue

        try {
          setCfCheckingIds((s) => (s.includes(d.id) ? s : [...s, d.id]))
          const res = await fetch(`/api/domains/${d.id}/cf-check`, {
            method: 'POST',
          })

          if (res.ok) {
            cfPollingRef.current[d.id] = { count: 0, last: Date.now() }
            await fetchDomains()
          } else if (res.status === 409) {
            // 409 means CNAME not configured - stop polling, user needs to take action
            cfPollingRef.current[d.id] = { count: 6, last: Date.now() }
          } else {
            cfPollingRef.current[d.id] = {
              count: attemptCount + 1,
              last: Date.now(),
            }
          }
        } catch (err) {
          cfPollingRef.current[d.id] = {
            count: attemptCount + 1,
            last: Date.now(),
          }
        } finally {
          setCfCheckingIds((s) => s.filter((x) => x !== d.id))
        }
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [domains])

  // Stats
  const verifiedCount = domains.filter((d) => d.verified).length
  const pendingCount = domains.filter((d) => !d.verified).length

  // Filter and sort domains
  const filteredDomains = domains
    .filter((d) => d.domain.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Primary first, then verified, then pending
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
      if (a.verified !== b.verified) return a.verified ? -1 : 1
      return a.domain.localeCompare(b.domain)
    })

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-subtle p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{domains.length}</p>
                <p className="text-xs text-muted-foreground">Total Domains</p>
              </div>
            </div>
          </div>

          <div className="glass-subtle p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>
          </div>

          <div className="glass-subtle p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>

          <div className="glass-subtle p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Sparkles className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {domainLimit?.unlimited
                    ? '∞'
                    : (domainLimit?.remaining ?? '∞')}
                </p>
                <p className="text-xs text-muted-foreground">Available Slots</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cloudflare tip */}
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
          <SiCloudflare className="mt-0.5 h-5 w-5 shrink-0 text-[#F38020]" />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">
              Using Cloudflare?
            </span>{' '}
            We can add the DNS records for you. Open a domain and choose{' '}
            <span className="font-medium text-foreground">
              Set up with Cloudflare
            </span>
            . Any DNS provider that supports CNAME records works too.
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search domains..."
              className="pl-9 bg-background/50"
            />
          </div>
          <Button
            onClick={() => setOpenAdd(true)}
            disabled={Boolean(
              domainLimit &&
              !domainLimit.unlimited &&
              (domainLimit.remaining ?? 1) <= 0
            )}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Domain
          </Button>
        </div>

        {/* Domain Limit Info */}
        {domainLimit && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            {domainLimit.unlimited ? (
              <span>
                Using {domainLimit.used} domain
                {domainLimit.used !== 1 ? 's' : ''} &mdash;{' '}
                <span className="text-primary">Unlimited slots</span>
              </span>
            ) : (
              <span>
                Using {domainLimit.used} of {domainLimit.allowed} domain slots
                {(domainLimit.purchased ?? 0) > 0 &&
                  ` (${domainLimit.purchased} ${billingEnabled ? 'purchased' : 'extra'})`}
              </span>
            )}
            {!domainLimit.unlimited &&
              (domainLimit.remaining ?? 1) <= 2 &&
              (domainLimit.remaining ?? 1) > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {domainLimit.remaining} remaining
                </Badge>
              )}
            {!domainLimit.unlimited && (domainLimit.remaining ?? 1) <= 0 && (
              <Badge variant="destructive" className="text-xs">
                Limit reached
              </Badge>
            )}
          </div>
        )}

        {/* Domain List */}
        <div className="glass-subtle overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icons.spinner className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DomainList
              domains={filteredDomains}
              cfCheckingIds={cfCheckingIds}
              onSetPrimary={setPrimary}
              onRecheck={recheckCloudflare}
              onDelete={removeDomain}
            />
          )}
        </div>

        {/* Help Text */}
        <p className="text-sm text-muted-foreground text-center">
          Need help? Check our{' '}
          <a
            href="https://docs.embrly.ca/docs/user-guide/custom-domains"
            className="text-primary hover:underline"
          >
            domain setup guide
          </a>{' '}
          or{' '}
          <a href="/contact" className="text-primary hover:underline">
            contact support
          </a>
          .
        </p>

        {/* Add Domain Dialog */}
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Add Custom Domain
              </DialogTitle>
              <DialogDescription>
                Connect your own domain to serve files from a custom URL.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={addDomain} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Domain Name
                </label>
                <Input
                  value={newDomain}
                  onChange={(e) => {
                    setNewDomain(e.target.value)
                    setError(null)
                  }}
                  placeholder="files.yourdomain.com"
                  className="font-mono"
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </div>

              <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  Setup Instructions
                </h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>
                    Add a CNAME record pointing to{' '}
                    <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">
                      cname.emberly.site
                    </code>
                  </li>
                  <li>We&apos;ll automatically verify and provision TLS</li>
                  <li>Your domain will be ready once verified</li>
                </ol>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenAdd(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={adding || !newDomain.trim()}>
                  {adding ? (
                    <>
                      <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Domain'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default ProfileDomains
