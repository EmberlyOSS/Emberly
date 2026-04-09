"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCode,
  Loader2,
  Package,
  RefreshCw,
  Tag,
  Trash2,
} from 'lucide-react'

import PromoCodesManager from '@/packages/components/admin/payments/promo-codes-manager'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Switch } from '@/packages/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'
import { useToast } from '@/packages/hooks/use-toast'

const SEED_SCRIPT_URL = 'https://github.com/EmberlyOSS/Emberly/blob/dev/scripts/seed-plans.ts'
const PAGE_SIZE = 10

export default function AdminProductManager() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const { toast } = useToast()

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to load products')
      setProducts(await res.json())
    } catch (err: any) {
      toast({ title: 'Failed to load products', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleToggle = async (id: string, field: 'active' | 'popular', value: boolean) => {
    setToggling(`${id}:${field}`)
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p))
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error('Update failed')
    } catch (err: any) {
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: !value } : p))
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' })
    } finally {
      setToggling(null)
    }
  }

  const handleSync = async (id: string, name: string) => {
    setSyncing(id)
    try {
      const res = await fetch(`/api/admin/products/${id}/sync`, { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      const data = await res.json()
      await fetchProducts()
      toast({ title: data.synced ? 'Synced to Stripe' : 'Already up to date', description: name })
    } catch (err: any) {
      toast({ title: 'Sync failed', description: err.message, variant: 'destructive' })
    } finally {
      setSyncing(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setToggling(`${id}:delete`)
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast({ title: 'Product deleted' })
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' })
    } finally {
      setToggling(null)
    }
  }

  const sorted = useMemo(
    () => [...products].sort((a, b) => Number(b.active) - Number(a.active)),
    [products]
  )

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <Tabs defaultValue="products">
      {/* ── Tab bar ── */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <TabsList className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 h-auto">
          <TabsTrigger
            value="products"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5"
          >
            <Package className="h-3.5 w-3.5" />
            Products
            {sorted.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground">
                {sorted.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="promo-codes"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5"
          >
            <Tag className="h-3.5 w-3.5" />
            Promo Codes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="m-0">
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </TabsContent>
      </div>

      {/* ── Products tab ── */}
      <TabsContent value="products" className="mt-0 space-y-4">
        {/* Seed notice */}
        <div className="glass-subtle rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <FileCode className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <span>
              Products are defined in{' '}
              <code className="font-mono text-xs bg-muted/40 px-1.5 py-0.5 rounded">scripts/seed-plans.ts</code>.
              Run <code className="font-mono text-xs bg-muted/40 px-1.5 py-0.5 rounded">bun run db:seed</code> to upsert
              and sync Stripe in one step. Use <strong className="text-foreground font-medium">Sync</strong> to push
              individual products without re-seeding.
            </span>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
            <Link href={SEED_SCRIPT_URL} target="_blank">
              <ExternalLink className="h-3 w-3" />
              Edit on GitHub
            </Link>
          </Button>
        </div>

        {/* Product list */}
        {loading ? (
          <div className="glass-card p-12 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm">Loading products…</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Add plans to <code className="font-mono text-xs">scripts/seed-plans.ts</code> and run{' '}
              <code className="font-mono text-xs">bun run db:seed</code>.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={SEED_SCRIPT_URL} target="_blank">
                <ExternalLink className="h-3 w-3" />
                Edit seed script
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="glass-card overflow-hidden">
              <div className="divide-y divide-border/50">
                {paginated.map((p) => (
                  <div key={p.id} className="p-5 group hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: info */}
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{p.name}</span>
                          {p.popular && (
                            <Badge className="bg-amber-500/15 text-amber-500 border-amber-400/30 border">Popular</Badge>
                          )}
                          {!p.active && (
                            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">Inactive</Badge>
                          )}
                          <Badge variant="outline" className="font-mono text-xs">{p.type || 'plan'}</Badge>
                        </div>

                        <p className="text-xs font-mono text-muted-foreground">{p.slug}</p>

                        {p.description && (
                          <p className="text-sm text-muted-foreground">{p.description}</p>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                          <span>Stripe: <span className="font-mono">{p.stripeProductId || '—'}</span></span>
                          <span>Billing: {p.billingInterval || 'n/a'}</span>
                          <span>Price: {p.defaultPriceCents != null ? `$${(p.defaultPriceCents / 100).toFixed(2)}` : 'n/a'}</span>
                          {p.storageQuotaGB != null && <span>Storage: {p.storageQuotaGB} GB</span>}
                          {p.uploadSizeCapMB != null && (
                            <span>Upload cap: {p.uploadSizeCapMB >= 1024 ? `${p.uploadSizeCapMB / 1024} GB` : `${p.uploadSizeCapMB} MB`}</span>
                          )}
                          {p.customDomainsLimit != null && <span>Domains: {p.customDomainsLimit}</span>}
                        </div>

                        {Array.isArray(p.features) && p.features.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {p.features.slice(0, 5).map((f: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs font-normal">{f}</Badge>
                            ))}
                            {p.features.length > 5 && (
                              <Badge variant="outline" className="text-xs font-normal">+{p.features.length - 5} more</Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground">
                            <Switch
                              checked={!!p.active}
                              onCheckedChange={(v) => handleToggle(p.id, 'active', v)}
                              disabled={toggling === `${p.id}:active`}
                              className="scale-75"
                            />
                            Active
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground">
                            <Switch
                              checked={!!p.popular}
                              onCheckedChange={(v) => handleToggle(p.id, 'popular', v)}
                              disabled={toggling === `${p.id}:popular`}
                              className="scale-75"
                            />
                            Popular
                          </label>
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                        {p.stripeProductId && (
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Open in Stripe">
                            <Link href={`https://dashboard.stripe.com/products/${p.stripeProductId}`} target="_blank">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleSync(p.id, p.name)}
                          disabled={syncing === p.id}
                          title="Sync to Stripe"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${syncing === p.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Edit seed script">
                          <Link href={SEED_SCRIPT_URL} target="_blank">
                            <FileCode className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(p.id)}
                          disabled={toggling === `${p.id}:delete`}
                          title="Delete product"
                        >
                          {toggling === `${p.id}:delete`
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <Button
                      key={n}
                      variant={n === page ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </TabsContent>

      {/* ── Promo Codes tab ── */}
      <TabsContent value="promo-codes" className="mt-0">
        <div className="glass-card">
          <div className="p-6">
            <PromoCodesManager />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
