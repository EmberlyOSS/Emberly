'use client'

import React, { useEffect, useState } from 'react'

import { ChevronDown } from 'lucide-react'
import { Check, Edit, Trash2 } from 'lucide-react'

import { Icons } from '@/components/shared/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

import { writeToClipboard } from '@/lib/utils/clipboard'

import { useToast } from '@/hooks/use-toast'

interface Domain {
  id: string
  domain: string
  verified: boolean
  verificationToken?: string | null
  isPrimary: boolean
}

export function ProfileDomains() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [verifyingIds, setVerifyingIds] = useState<string[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [openIds, setOpenIds] = useState<string[]>([])

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

  const verifyDomain = async (id: string) => {
    try {
      setVerifyingIds((s) => (s.includes(id) ? s : [...s, id]))
      const res = await fetch(`/api/domains/${id}/verify`, { method: 'POST' })
      if (res.status === 404) {
        toast({
          title: 'Verification not found',
          description: 'TXT record not found',
        })
        return
      }
      if (!res.ok) throw new Error('Failed')
      toast({
        title: 'Domain verified',
        description: 'Domain verification succeeded',
      })
      await fetchDomains()
    } catch (err) {
      toast({
        title: 'Verification failed',
        description: 'Failed to verify domain',
      })
    } finally {
      setVerifyingIds((s) => s.filter((x) => x !== id))
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await writeToClipboard(text)
      toast({ title: 'Copied', description: 'Copied to clipboard' })
    } catch (e) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
      })
    }
  }

  // Poll for verification automatically for unverified domains that have a token
  useEffect(() => {
    const interval = setInterval(async () => {
      for (const d of domains) {
        if (
          !d.verified &&
          d.verificationToken &&
          !verifyingIds.includes(d.id)
        ) {
          // run a quiet check
          try {
            setVerifyingIds((s) => (s.includes(d.id) ? s : [...s, d.id]))
            const res = await fetch(`/api/domains/${d.id}/verify`, {
              method: 'POST',
            })
            if (res.ok) {
              toast({
                title: 'Domain verified',
                description: `${d.domain} verified`,
              })
              await fetchDomains()
            }
            // if 404, keep waiting silently
          } catch (err) {
            // ignore network errors during polling
          } finally {
            setVerifyingIds((s) => s.filter((x) => x !== d.id))
          }
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [domains, verifyingIds])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Domains</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>Serve files from your domain</AlertTitle>
          <AlertDescription>
            <p className="text-sm text-muted-foreground">
              For root domains, use CNAME flattening/ANAME/ALIAS if your
              provider supports it.
            </p>
            <div className="mt-3">
              <strong>Notes:</strong>
              <ul className="mt-2 ml-4 list-disc text-sm">
                <li>Proxied (CDN) mode is recommended for TLS and caching.</li>
                <li>
                  Allow up to 24–48 hours for DNS propagation and cert issuance.
                </li>
                <li>If you need help, contact the Emberly team.</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <Separator className="my-2" />

        <form onSubmit={addDomain} className="flex gap-2">
          <Input
            placeholder="example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={adding}>
            {adding ? 'Adding…' : 'Add Domain'}
          </Button>
        </form>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <div>
          <h3 className="font-medium mb-2">Your domains</h3>
          {loading && (
            <div className="text-sm text-muted-foreground">Loading…</div>
          )}
          {!loading && domains.length === 0 && (
            <div className="text-sm text-muted-foreground">No domains yet.</div>
          )}
          <ul className="space-y-4">
            {domains.map((d) => (
              <li key={d.id} className="flex flex-col gap-3">
                <div className="relative rounded-xl bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5 backdrop-blur-sm overflow-hidden p-4">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10 pointer-events-none" />
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="font-medium truncate">{d.domain}</div>
                        {d.isPrimary && (
                          <span className="text-xs text-muted-foreground">
                            • Primary
                          </span>
                        )}
                        {verifyingIds.includes(d.id) ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-400">
                            <Icons.spinner className="h-3 w-3 animate-spin" />
                            Checking
                          </span>
                        ) : d.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-green-500/10 text-green-400">
                            <Check className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-red-500/10 text-red-400">
                            <Icons.alertCircle className="h-3 w-3" />
                            Unverified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        aria-expanded={openIds.includes(d.id)}
                        onClick={() => toggleOpen(d.id)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <span>
                          {openIds.includes(d.id) ? 'Hide DNS' : 'Show DNS'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${openIds.includes(d.id) ? 'rotate-180' : 'rotate-0'}`}
                        />
                      </button>
                      {d.verified && !d.isPrimary && (
                        <Button size="sm" onClick={() => setPrimary(d.id)}>
                          Set primary
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label="Edit domain"
                        onClick={() =>
                          toast({
                            title: 'Edit',
                            description: 'Edit domain not implemented yet',
                          })
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        aria-label="Delete domain"
                        onClick={() => setDeletingId(d.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Collapsible open={openIds.includes(d.id)}>
                    <CollapsibleContent>
                      {!d.verified && (
                        <>
                          <div className="relative mt-2 rounded-xl bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5 backdrop-blur-sm p-3 overflow-hidden">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10 pointer-events-none" />
                            <div className="text-sm font-medium mb-2">
                              CNAME (recommended)
                            </div>
                            <div className="grid grid-cols-3 gap-4 items-center text-xs">
                              <div className="text-muted-foreground">Type</div>
                              <div className="text-muted-foreground">Name</div>
                              <div className="text-muted-foreground">Value</div>

                              <div className="font-medium">CNAME</div>
                              <div className="truncate">
                                www{' '}
                                <span className="text-xs text-muted-foreground">
                                  (or @)
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <code className="font-mono truncate">
                                  cname.emberly.site
                                </code>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  aria-label="Copy CNAME"
                                  onClick={() =>
                                    copyToClipboard('cname.emberly.site')
                                  }
                                >
                                  <Icons.copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="mt-3 text-xs text-muted-foreground">
                              Proxied (CDN) mode is recommended for TLS and
                              caching.
                            </div>
                          </div>

                          {d.verificationToken && (
                            <div className="relative mt-2 rounded-xl bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5 backdrop-blur-sm p-3 overflow-hidden">
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10 pointer-events-none" />
                              <div className="text-sm font-medium mb-2">
                                Verification (TXT)
                              </div>
                              <div className="grid grid-cols-3 gap-4 items-center text-xs">
                                <div className="text-muted-foreground">
                                  Type
                                </div>
                                <div className="text-muted-foreground">
                                  Name
                                </div>
                                <div className="text-muted-foreground">
                                  Value
                                </div>

                                <div className="font-medium">TXT</div>
                                <div className="truncate">
                                  <code className="font-mono">
                                    _emberly-verify.{d.domain}
                                  </code>
                                </div>
                                <div className="flex items-center justify-between">
                                  <code className="font-mono truncate mr-2">
                                    {d.verificationToken}
                                  </code>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    aria-label="Copy TXT token"
                                    onClick={() =>
                                      copyToClipboard(d.verificationToken)
                                    }
                                  >
                                    <Icons.copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {d.verified && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          This domain is verified and ready to use.
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                  <Dialog
                    open={deletingId === d.id}
                    onOpenChange={(open) => !open && setDeletingId(null)}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete domain</DialogTitle>
                      </DialogHeader>
                      <div className="text-sm text-muted-foreground">
                        Are you sure you want to delete{' '}
                        <strong>{d.domain}</strong>? This action cannot be
                        undone.
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setDeletingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            setDeleting(true)
                            await removeDomain(d.id)
                            setDeleting(false)
                            setDeletingId(null)
                          }}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Separator className="my-2" />

        <div className="text-sm text-muted-foreground">
          If you need help configuring your DNS provider, open a support request
          with your domain registrar or contact the Emberly team.
        </div>
      </CardContent>
    </Card>
  )
}

export default ProfileDomains
