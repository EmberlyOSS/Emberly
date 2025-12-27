"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { ExternalLink, Package, Plus, Trash2 } from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { Switch } from '@/packages/components/ui/switch'
import { Textarea } from '@/packages/components/ui/textarea'
import { useToast } from '@/packages/hooks/use-toast'
import { cn } from '@/packages/lib/utils'

const emptyForm = {
  id: null as string | null,
  name: '',
  slug: '',
  description: '',
  type: 'plan',
  stripeProductId: '',
  stripePriceMonthlyId: '',
  stripePriceYearlyId: '',
  stripePriceOneTimeId: '',
  defaultPriceCents: '',
  billingInterval: 'month',
  features: '' as string,
  active: true,
  popular: false,
}

export default function AdminProductManager() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
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

  const resetForm = () => {
    setForm({ ...emptyForm })
  }

  const startEdit = (p: any) => {
    setForm({
      id: p.id,
      name: p.name || '',
      slug: p.slug || '',
      description: p.description || '',
      type: p.type || 'plan',
      stripeProductId: p.stripeProductId || '',
      stripePriceMonthlyId: p.stripePriceMonthlyId || '',
      stripePriceYearlyId: p.stripePriceYearlyId || '',
      stripePriceOneTimeId: p.stripePriceOneTimeId || '',
      defaultPriceCents: p.defaultPriceCents != null ? String(p.defaultPriceCents) : '',
      billingInterval: p.billingInterval || 'month',
      features: Array.isArray(p.features) ? p.features.join('\n') : '',
      active: !!p.active,
      popular: !!p.popular,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload: any = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        type: form.type || 'plan',
        stripeProductId: form.stripeProductId || null,
        stripePriceMonthlyId: form.stripePriceMonthlyId || null,
        stripePriceYearlyId: form.stripePriceYearlyId || null,
        stripePriceOneTimeId: form.stripePriceOneTimeId || null,
        defaultPriceCents: form.defaultPriceCents === '' ? null : Number(form.defaultPriceCents),
        billingInterval: form.billingInterval || null,
        features: form.features
          ? form.features
            .split(/\r?\n/)
            .map((f) => f.trim())
            .filter(Boolean)
          : [],
        active: form.active,
        popular: form.popular,
      }

      const res = await fetch(form.id ? `/api/products/${form.id}` : '/api/products', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Save failed')
      await fetchProducts()
      toast({ title: form.id ? 'Product updated' : 'Product created', description: form.name })
      resetForm()
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      await fetchProducts()
      toast({ title: 'Product deleted' })
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const formTitle = form.id ? 'Edit product' : 'Create product'

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => Number(b.active) - Number(a.active))
  }, [products])

  return (
    <div className="space-y-6 w-full">
      {/* Product Form */}
      <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-medium">{formTitle}</span>
              <p className="text-xs text-muted-foreground">Manage Stripe-linked products</p>
            </div>
          </div>
          {form.id ? (
            <Button variant="ghost" size="sm" onClick={resetForm}>Cancel edit</Button>
          ) : null}
        </div>

        <form className="p-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} className="bg-background/50 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="bg-background/50 border-border/50 font-mono text-sm" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan">Plan</SelectItem>
                  <SelectItem value="addon">Add-on</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingInterval">Billing Interval</Label>
              <Select value={form.billingInterval} onValueChange={(value) => setForm({ ...form, billingInterval: value })}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-background/50 border-border/50" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stripeProductId">Stripe Product ID</Label>
              <Input id="stripeProductId" value={form.stripeProductId} onChange={(e) => setForm({ ...form, stripeProductId: e.target.value })} placeholder="prod_xxx" className="bg-background/50 border-border/50 font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultPriceCents">Default Price (cents)</Label>
              <Input id="defaultPriceCents" type="number" inputMode="numeric" value={form.defaultPriceCents} onChange={(e) => setForm({ ...form, defaultPriceCents: e.target.value })} className="bg-background/50 border-border/50" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="stripePriceMonthlyId">Monthly Price ID</Label>
              <Input id="stripePriceMonthlyId" value={form.stripePriceMonthlyId} onChange={(e) => setForm({ ...form, stripePriceMonthlyId: e.target.value })} placeholder="price_xxx" className="bg-background/50 border-border/50 font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripePriceYearlyId">Yearly Price ID</Label>
              <Input id="stripePriceYearlyId" value={form.stripePriceYearlyId} onChange={(e) => setForm({ ...form, stripePriceYearlyId: e.target.value })} placeholder="price_xxx" className="bg-background/50 border-border/50 font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripePriceOneTimeId">One-time Price ID</Label>
              <Input id="stripePriceOneTimeId" value={form.stripePriceOneTimeId} onChange={(e) => setForm({ ...form, stripePriceOneTimeId: e.target.value })} placeholder="price_xxx" className="bg-background/50 border-border/50 font-mono text-xs" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Features (one per line)</Label>
            <Textarea id="features" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Custom domains&#10;Analytics&#10;Priority support" className="bg-background/50 border-border/50 font-mono text-sm" rows={4} />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/30 px-4 py-3">
              <Switch id="active" checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} />
              <Label htmlFor="active" className="cursor-pointer">Active</Label>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/30 px-4 py-3">
              <Switch id="popular" checked={form.popular} onCheckedChange={(checked) => setForm({ ...form, popular: checked })} />
              <Label htmlFor="popular" className="cursor-pointer">Popular badge</Label>
            </div>
            <div className="ml-auto">
              <Button type="submit" disabled={saving} className="gap-2">
                <Plus className="h-4 w-4" />
                {form.id ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Product List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Existing Products</h2>
              <p className="text-sm text-muted-foreground">{sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchProducts} disabled={loading}>Refresh</Button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border/50 bg-background/30 p-8 text-center text-muted-foreground">
            Loading products...
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="rounded-xl border border-border/50 border-dashed bg-background/30 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2">No products yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first product to start selling plans and add-ons.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedProducts.map((p) => (
              <div key={p.id} className="rounded-xl border border-border/50 bg-background/30 p-4 group hover:border-primary/30 transition-colors">
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
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.stripeProductId && (
                      <Button asChild variant="ghost" size="sm" className="gap-2 h-8">
                        <Link href={`https://dashboard.stripe.com/products/${p.stripeProductId}`} target="_blank">
                          <ExternalLink className="h-3 w-3" />
                          Stripe
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => startEdit(p)} className="h-8">Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} disabled={saving} className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
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
