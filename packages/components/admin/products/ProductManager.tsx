"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { ExternalLink, FileCode, Package, RefreshCw, Trash2 } from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Switch } from '@/packages/components/ui/switch'
import { useToast } from '@/packages/hooks/use-toast'

const SEED_SCRIPT_URL = 'https://github.com/EmberlyOSS/Website/blob/dev/scripts/seed-plans.ts'

export default function AdminProductManager() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()
      setProducts(data)
    } catch (err: any) {
      toast({ title: 'Failed to load products', description: err.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleToggle = async (id: string, field: 'active' | 'popular', value: boolean) => {
    setToggling(`${id}:${field}`)
    // Optimistic update
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p))
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error('Update failed')
    } catch (err: any) {
      // Revert on failure
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: !value } : p))
      toast({ title: 'Update failed', description: err.message || 'Please try again.', variant: 'destructive' })
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
      toast({
        title: data.synced ? 'Synced to Stripe' : 'Already up to date',
        description: name,
      })
    } catch (err: any) {
      toast({ title: 'Sync failed', description: err.message || 'Please try again.', variant: 'destructive' })
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
      toast({ title: 'Delete failed', description: err.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setToggling(null)
    }
  }

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => Number(b.active) - Number(a.active))
  }, [products])

  return (
    <div className="space-y-6 w-full">
      {/* Header notice */}
      <div className="glass-subtle rounded-xl px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <FileCode className="h-4 w-4 shrink-0 text-primary" />
          <span>Products are defined in <code className="font-mono text-xs bg-muted/40 px-1.5 py-0.5 rounded">scripts/seed-plans.ts</code>. To add or change a plan, edit that file and run <code className="font-mono text-xs bg-muted/40 px-1.5 py-0.5 rounded">bun run db:seed</code> — it upserts the DB and syncs Stripe in one step. Use the <strong className="text-foreground font-medium">Sync</strong> button below to push an individual product to Stripe without re-seeding (e.g. if a price ID is missing).</span>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
          <Link href={SEED_SCRIPT_URL} target="_blank">
            <ExternalLink className="h-3 w-3" />
            Edit on GitHub
          </Link>
        </Button>
      </div>

      {/* Product List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Products</h2>
              <p className="text-sm text-muted-foreground">{sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchProducts} disabled={loading}>Refresh</Button>
        </div>

        {loading ? (
          <div className="glass-subtle p-8 text-center text-muted-foreground">
            Loading products...
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="glass-subtle border-dashed p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2">No products yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Add plans to <code className="font-mono text-xs">scripts/seed-plans.ts</code> and run <code className="font-mono text-xs">bun run db:seed</code>.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={SEED_SCRIPT_URL} target="_blank">
                <ExternalLink className="h-3 w-3" />
                Edit seed script
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedProducts.map((p) => (
              <div key={p.id} className="glass-subtle p-4 group glass-hover transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{p.name}</span>
                      {p.popular && <Badge className="bg-chart-4/20 text-chart-4 border-0">Popular</Badge>}
                      {!p.active && <Badge variant="secondary" className="bg-muted/50">Inactive</Badge>}
                      <Badge variant="outline" className="font-mono text-xs">{p.type || 'plan'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{p.slug}</p>
                    {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Stripe: <span className="font-mono">{p.stripeProductId || '—'}</span></span>
                      <span>Billing: {p.billingInterval || 'n/a'}</span>
                      <span>Price: {p.defaultPriceCents != null ? `$${(p.defaultPriceCents / 100).toFixed(2)}` : 'n/a'}</span>
                      {p.storageQuotaGB != null && <span>Storage: {p.storageQuotaGB} GB</span>}
                      {p.uploadSizeCapMB != null && <span>Upload cap: {p.uploadSizeCapMB >= 1024 ? `${p.uploadSizeCapMB / 1024} GB` : `${p.uploadSizeCapMB} MB`}</span>}
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
                    {/* Inline toggles */}
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
                  <div className="flex flex-col gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {p.stripeProductId && (
                      <Button asChild variant="ghost" size="sm" className="gap-2 h-8">
                        <Link href={`https://dashboard.stripe.com/products/${p.stripeProductId}`} target="_blank">
                          <ExternalLink className="h-3 w-3" />
                          Stripe
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSync(p.id, p.name)}
                      disabled={syncing === p.id}
                      className="gap-2 h-8"
                    >
                      <RefreshCw className={`h-3 w-3 ${syncing === p.id ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="gap-2 h-8">
                      <Link href={SEED_SCRIPT_URL} target="_blank">
                        <FileCode className="h-3 w-3" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(p.id)}
                      disabled={toggling === `${p.id}:delete`}
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
