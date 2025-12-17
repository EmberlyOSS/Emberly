'use client'

import React, { useEffect, useRef, useState } from 'react'

import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/packages/components/ui/dialog'
import { Search } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/packages/components/ui/alert'
import { Separator } from '@/packages/components/ui/separator'

import { useToast } from '@/packages/hooks/use-toast'

import DomainForm from './DomainForm'
import DomainList from './DomainList'
import type { Domain } from './types'

export function ProfileDomains() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')

  const [cfCheckingIds, setCfCheckingIds] = useState<string[]>([])
  const cfPollingRef = useRef<Record<string, { count: number; last: number }>>({})
  const [newDomain, setNewDomain] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [domainLimit, setDomainLimit] = useState<{ allowed: number; base: number; purchased: number; used: number; remaining: number } | null>(null)
  const { toast } = useToast()
  const [openIds, setOpenIds] = useState<string[]>([])
  const [openAdd, setOpenAdd] = useState(false)

  const toggleOpen = (id: string) => {
    setOpenIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const fetchDomains = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/domains')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setDomains(data.domains || [])
      setDomainLimit(data.domainLimit || null)
    } catch (err) {
      setError('Could not load domains')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDomains()
  }, [])

  const addDomain = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setAdding(true)
    setError(null)
    if (domainLimit && domainLimit.remaining <= 0) {
      setError('Domain limit reached for your plan. Purchase extra slots to add more.')
      setAdding(false)
      return
    }
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain }),
      })
      if (res.status === 409) return setError('Domain already exists')
      if (!res.ok) throw new Error('Failed')
      setNewDomain('')
      setOpenAdd(false)
      await fetchDomains()
    } catch (err) {
      setError('Failed to add domain')
    } finally {
      setAdding(false)
    }
  }

  const removeDomain = async (id: string) => {
    try {
      const res = await fetch(`/api/domains/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      await fetchDomains()
    } catch (err) {
      toast({ title: 'Delete failed', description: 'Failed to delete domain' })
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
      await fetchDomains()
    } catch (err) {
      toast({ title: 'Failed', description: 'Failed to set primary domain' })
    }
  }

  const recheckCloudflare = async (id: string) => {
    try {
      setCfCheckingIds((s) => (s.includes(id) ? s : [...s, id]))
      const res = await fetch(`/api/domains/${id}/cf-check`, { method: 'POST' })
      if (res.status === 202) {
        toast({ title: 'Cloudflare request submitted', description: 'Cloudflare is processing the hostname' })
        await fetchDomains()
        return
      }

      const data = await res.json().catch(() => null)
      if (res.ok) {
        if (data?.status && String(data.status).toLowerCase().includes('active')) {
          toast({ title: 'Domain verified', description: 'Cloudflare hostname is active' })
        } else {
          toast({ title: 'Checked', description: 'Cloudflare status updated' })
        }
        await fetchDomains()
        return
      }

      const msg = data?.suggestion || data?.error || (data?.body ? JSON.stringify(data.body) : 'Cloudflare check failed')
      toast({ title: 'Cloudflare error', description: String(msg) })
      console.debug('CF check error payload', data)
    } catch (err) {
      toast({ title: 'Check failed', description: 'Failed to check Cloudflare status' })
    } finally {
      setCfCheckingIds((s) => s.filter((x) => x !== id))
    }
  }

  // polling/backoff loop
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now()
      for (const d of domains) {
        if (d.verified || d.cfStatus === 'active' || d.cfStatus === 'unsupported') continue
        const state = cfPollingRef.current[d.id] ?? { count: 0, last: 0 }
        const attemptCount = state.count || 0
        const delay = 5000 * Math.pow(2, Math.min(attemptCount, 5))
        if (now - (state.last || 0) < delay) continue
        if (attemptCount >= 6) continue

        try {
          setCfCheckingIds((s) => (s.includes(d.id) ? s : [...s, d.id]))
          const res = await fetch(`/api/domains/${d.id}/cf-check`, { method: 'POST' })
          if (res.ok) {
            cfPollingRef.current[d.id] = { count: 0, last: Date.now() }
            await fetchDomains()
          } else {
            cfPollingRef.current[d.id] = { count: attemptCount + 1, last: Date.now() }
            await fetchDomains()
          }
        } catch (err) {
          cfPollingRef.current[d.id] = { count: attemptCount + 1, last: Date.now() }
        } finally {
          setCfCheckingIds((s) => s.filter((x) => x !== d.id))
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [domains])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Custom Domains</h2>
        <p className="text-sm text-muted-foreground">Manage your custom domains, DNS requirements, and verification status.</p>
      </div>
      <div className="space-y-4">
        <div className="">
          {/* Left column: info + add domain */}
          <div className="md:col-span-1">
            <Alert className="mb-4" variant="info">
              <div className="flex items-start gap-3">
                <div className="text-violet-400 mt-0.5">
                  <Icons.infinity className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <AlertTitle className="font-extrabold">Why we recommend Cloudflare</AlertTitle>
                      <AlertDescription>
                        Cloudflare provides automated TLS for custom hostnames and the zone-level APIs we use to verify and provision certificates.
                      </AlertDescription>
                    </div>
                    <div className="shrink-0">
                      <a href="https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/domain-support/" target="_blank" rel="noopener noreferrer" className="text-sm underline">Learn how</a>
                    </div>
                  </div>

                  <ul className="mt-3 text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Automated TLS issuance no manual certificates required.</li>
                    <li>Zone-level DNS APIs enable faster, more reliable verification.</li>
                    <li>Works with CNAME hostnames (www), root (@) and wildcard (*) configurations when supported by your DNS provider.</li>
                  </ul>

                  {error && <div className="text-sm text-destructive mt-3">{error}</div>}
                </div>
              </div>
            </Alert>
          </div>

          {/* Right column: search + list */}
          <div className="md:col-span-2">
            <div className="mb-4 items-center justify-between gap-3">
              <label className="sr-only">Search domains</label>
              <div className="relative bg-muted/60 rounded-md w-full border hover:border-primary/20">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search domains..."
                  className="w-full pl-9 pr-3 py-2 rounded border bg-transparent text-sm"
                />
              </div>
              <div className="flex items-center gap-2 ml-3 mt-4">
                <Button variant="outline" onClick={() => { /* filter placeholder */ }}>Filter</Button>
                <Button onClick={() => setOpenAdd(true)} disabled={Boolean(domainLimit && domainLimit.remaining <= 0)}>Add Domain</Button>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">Your domains</div>
            {domainLimit && (
              <div className="text-xs text-muted-foreground">{domainLimit.used} of {domainLimit.allowed} domains used ({domainLimit.purchased} purchased extra) — {domainLimit.remaining} remaining</div>
            )}
          </div>

          {/* compute filtered + sorted list: verified domains first, then others */}
          {(() => {
            const q = search.trim().toLowerCase()
            const filtered = domains
              .filter(d => d.domain.toLowerCase().includes(q))
              .sort((a, b) => Number(b.verified ? 1 : 0) - Number(a.verified ? 1 : 0))
            return (
              <div className="rounded-md border border-white/6 bg-white/2 overflow-hidden">
                <DomainList
                  domains={filtered}
                  openIds={openIds}
                  cfCheckingIds={cfCheckingIds}
                  onToggle={toggleOpen}
                  onSetPrimary={setPrimary}
                  onRecheck={recheckCloudflare}
                  onDelete={removeDomain}
                />
              </div>
            )
          })()}
        </div>

        {/* Add Domain modal */}
        <Dialog open={openAdd} onOpenChange={(o) => setOpenAdd(o)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Domain</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground mb-4">Add a custom domain you own. We'll verify ownership via DNS and provision TLS using Cloudflare.</div>
            <div className="rounded-md border border-white/6 bg-white/3 dark:bg-black/3 p-3 mb-4">
              <div className="text-sm font-medium">How verification works</div>
              <div className="mt-2 text-xs text-muted-foreground">When you add a domain we ask you to create a CNAME record for the hostname (typically <code className="font-mono">www</code>) pointing to our target. Once the DNS record is present we create a Cloudflare custom hostname and provision TLS for your domain.</div>
            </div>
            <DomainForm value={newDomain} onChange={setNewDomain} onSubmit={addDomain} loading={adding} />
          </DialogContent>
        </Dialog>

        <Separator className="my-2" />

        <div className="text-sm text-muted-foreground">If you need help configuring your DNS provider, open a support request with your domain registrar or contact the Emberly team.</div>
      </div>
    </div>
  )
}

export default ProfileDomains