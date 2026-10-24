'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Globe, Plus, Search } from 'lucide-react'
import { SiCloudflare } from 'react-icons/si'

import { Icons } from '@/components/shared/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  EmptyState,
  Panel,
  StatGrid,
  StatTile,
} from '@/components/layout/page-kit'
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

  const atLimit = Boolean(
    domainLimit && !domainLimit.unlimited && (domainLimit.remaining ?? 1) <= 0
  )
  const slotsLeft = domainLimit?.unlimited
    ? '∞'
    : (domainLimit?.remaining ?? '∞')

  return (
    <TooltipProvider>
      <StatGrid>
        <StatTile label="Domains" value={domains.length} />
        <StatTile label="Verified" value={verifiedCount} tone="success" />
        <StatTile
          label="Needs setup"
          value={pendingCount}
          tone={pendingCount ? 'warning' : 'default'}
        />
        <StatTile
          label="Slots left"
          value={slotsLeft}
          hint={
            domainLimit && !domainLimit.unlimited
              ? `${domainLimit.used} of ${domainLimit.allowed} used`
              : undefined
          }
        />
      </StatGrid>

      {openAdd && (
        <Panel
          title="Add a domain"
          description="Use a subdomain you control, like files.yourdomain.com."
        >
          <form onSubmit={addDomain} className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newDomain}
                onChange={(e) => {
                  setNewDomain(e.target.value)
                  setError(null)
                }}
                placeholder="files.yourdomain.com"
                aria-label="Domain name"
                className="font-mono sm:flex-1"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenAdd(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={adding || !newDomain.trim()}>
                  {adding && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add domain
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-sm text-muted-foreground">
              Next, add a CNAME record pointing to{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                cname.emberly.site
              </code>
              . HTTPS is set up automatically once it&apos;s verified.
            </p>
          </form>
        </Panel>
      )}

      <Panel
        flush
        title="Your domains"
        description={
          <span className="inline-flex items-center gap-1.5">
            <SiCloudflare className="h-4 w-4 shrink-0 text-[#F38020]" />
            On Cloudflare? Open a domain and choose Set up with Cloudflare to
            add the DNS record for you.
          </span>
        }
        actions={
          !openAdd && (
            <Button
              size="sm"
              onClick={() => setOpenAdd(true)}
              disabled={atLimit}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {atLimit ? 'Limit reached' : 'Add domain'}
            </Button>
          )
        }
      >
        {domains.length > 3 && (
          <div className="border-b border-border/50 px-5 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search domains"
                aria-label="Search domains"
                className="h-9 bg-background/50 pl-9"
              />
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icons.spinner className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : domains.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="No domains yet"
            description="Connect your own domain to share files and short links from it."
          />
        ) : (
          <DomainList
            domains={filteredDomains}
            cfCheckingIds={cfCheckingIds}
            onSetPrimary={setPrimary}
            onRecheck={recheckCloudflare}
            onDelete={removeDomain}
          />
        )}
      </Panel>

      <p className="text-center text-sm text-muted-foreground">
        Need help? Read the{' '}
        <a
          href="https://docs.embrly.ca/user-guide/custom-domains"
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
    </TooltipProvider>
  )
}

export default ProfileDomains
