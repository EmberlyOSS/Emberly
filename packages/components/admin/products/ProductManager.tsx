"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
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
    <div className="space-y-8 w-full">
      <div className="rounded-2xl border border-border/50 bg-background/50 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold">{formTitle}</h2>
            <p className="text-sm text-muted-foreground">Manage Stripe-linked products used for plans.</p>
          </div>
          {form.id ? (
            <Button variant="ghost" size="sm" onClick={resetForm}>Cancel edit</Button>
          ) : null}
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              className={cn('h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring')}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="plan">Plan</option>
              <option value="addon">Add-on</option>
              <option value="one-time">One-time</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="stripeProductId">Stripe product ID</Label>
              <Input id="stripeProductId" value={form.stripeProductId} onChange={(e) => setForm({ ...form, stripeProductId: e.target.value })} placeholder="prod_xxx" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="defaultPriceCents">Default price (cents)</Label>
              <Input id="defaultPriceCents" type="number" inputMode="numeric" value={form.defaultPriceCents} onChange={(e) => setForm({ ...form, defaultPriceCents: e.target.value })} />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="stripePriceMonthlyId">Stripe monthly price ID</Label>
              <Input id="stripePriceMonthlyId" value={form.stripePriceMonthlyId} onChange={(e) => setForm({ ...form, stripePriceMonthlyId: e.target.value })} placeholder="price_monthly_xxx" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stripePriceYearlyId">Stripe yearly price ID</Label>
              <Input id="stripePriceYearlyId" value={form.stripePriceYearlyId} onChange={(e) => setForm({ ...form, stripePriceYearlyId: e.target.value })} placeholder="price_yearly_xxx" />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="stripePriceOneTimeId">Stripe one-time price ID</Label>
              <Input id="stripePriceOneTimeId" value={form.stripePriceOneTimeId} onChange={(e) => setForm({ ...form, stripePriceOneTimeId: e.target.value })} placeholder="price_one_time_xxx" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea id="features" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Custom domains
Analytics" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="billingInterval" className="whitespace-nowrap">Billing interval</Label>
            <select
              id="billingInterval"
              className={cn('h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring')}
              value={form.billingInterval}
              onChange={(e) => setForm({ ...form, billingInterval: e.target.value })}
            >
              <option value="month">month</option>
              <option value="year">year</option>
              <option value="one-time">one-time</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="active" checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="popular" checked={form.popular} onCheckedChange={(checked) => setForm({ ...form, popular: checked })} />
            <Label htmlFor="popular">Popular badge</Label>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>{form.id ? 'Update product' : 'Create product'}</Button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Existing products</h2>
          <Button variant="ghost" size="sm" onClick={fetchProducts} disabled={loading}>Refresh</Button>
        </div>
        <div className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading products...</p> : null}
          {sortedProducts.length === 0 && !loading ? <p className="text-sm text-muted-foreground">No products yet.</p> : null}
          {sortedProducts.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border/50 bg-background/50 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{p.name}</span>
                    {p.popular ? <span className="text-xs rounded-full bg-primary/15 text-primary px-2 py-0.5">popular</span> : null}
                    {!p.active ? <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">inactive</span> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{p.slug}</p>
                  {p.description ? <p className="text-sm text-muted-foreground">{p.description}</p> : null}
                  <p className="text-xs text-muted-foreground">Type: {p.type || 'plan'} | Stripe: {p.stripeProductId || '—'} | Billing: {p.billingInterval || 'n/a'} | Default price: {p.defaultPriceCents != null ? `$${(p.defaultPriceCents / 100).toFixed(2)}` : 'n/a'}</p>
                  <p className="text-xs text-muted-foreground">Monthly price: {p.stripePriceMonthlyId || '—'} | Yearly price: {p.stripePriceYearlyId || '—'} | One-time price: {p.stripePriceOneTimeId || '—'}</p>
                  {Array.isArray(p.features) && p.features.length ? (
                    <p className="text-xs text-muted-foreground">Features: {p.features.join(', ')}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  {p.stripeProductId ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`https://dashboard.stripe.com/products/${p.stripeProductId}`}>Open in Stripe</Link>
                    </Button>
                  ) : null}
                  <Button variant="secondary" size="sm" onClick={() => startEdit(p)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)} disabled={saving}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
