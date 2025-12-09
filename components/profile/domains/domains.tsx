'use client'

import React, { useEffect, useRef, useState } from 'react'

import { Icons } from '@/components/shared/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { useToast } from '@/hooks/use-toast'

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
    <Card>
      <CardHeader>
        <CardTitle>Custom Domains</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {/* Left column: info + add domain */}
          <div className="md:col-span-1">
            <div className="flex items-start gap-3">
              <div className="text-violet-400 mt-0.5">
                <Icons.infinity className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-medium">Recommended DNS provider</div>
                <div className="mt-1 text-sm text-muted-foreground">Cloudflare is recommended for easy TLS issuance and fast DNS propagation. Use Cloudflare for best results.</div>
                <div className="mt-2 text-xs text-muted-foreground">See Cloudflare docs for adding custom hostnames and required DNS records.</div>
                <div className="mt-4">
                  <Button onClick={() => setOpenAdd(true)}>Add Domain</Button>
                </div>
                {error && <div className="text-sm text-destructive mt-3">{error}</div>}
              </div>
            </div>
          </div>

          {/* Right column: search + list */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <label className="sr-only">Search domains</label>
              <div className="relative">
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
              <div className="mt-2 text-sm text-muted-foreground">Your domains</div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center px-3 py-2 text-xs text-muted-foreground border-b border-white/6 bg-white/2 dark:bg-black/3 rounded-t-md gap-2">
              <div className="flex-1 font-medium">Domain</div>
              <div className="w-full sm:w-48 text-left sm:text-right font-medium">Status</div>
              <div className="w-full sm:w-36 text-left sm:text-right font-medium">Actions</div>
            </div>

            {/* compute filtered + sorted list: verified domains first, then others */}
            {(() => {
              const q = search.trim().toLowerCase()
              const filtered = domains
                .filter(d => d.domain.toLowerCase().includes(q))
                .sort((a, b) => Number(b.verified ? 1 : 0) - Number(a.verified ? 1 : 0))
              return (
                <DomainList
                  domains={filtered}
                  openIds={openIds}
                  cfCheckingIds={cfCheckingIds}
                  onToggle={toggleOpen}
                  onSetPrimary={setPrimary}
                  onRecheck={recheckCloudflare}
                  onDelete={removeDomain}
                />
              )
            })()}
          </div>
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
                <div className="mt-3 flex items-center gap-3">
                  <div className="font-mono text-xs">Host: <span className="ml-2">www</span></div>
                  <div className="font-mono text-xs">Target: <span className="ml-2">cname.emberly.site</span></div>
                  <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard?.writeText('cname.emberly.site') }} title="Copy target"><Icons.copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <DomainForm value={newDomain} onChange={setNewDomain} onSubmit={addDomain} loading={adding} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Separator className="my-2" />

        <div className="text-sm text-muted-foreground">If you need help configuring your DNS provider, open a support request with your domain registrar or contact the Emberly team.</div>
      </CardContent>
    </Card>
  )
}

export default ProfileDomains