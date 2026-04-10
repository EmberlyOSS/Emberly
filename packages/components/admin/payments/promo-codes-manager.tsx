'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  BadgePercent,
  Copy,
  DollarSign,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/packages/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/packages/components/ui/table'
import { useToast } from '@/packages/hooks/use-toast'

interface PromoCode {
  id: string
  code: string
  active: boolean
  couponId: string
  couponName: string | null
  percentOff: number | null
  amountOff: number | null
  currency: string | null
  timesRedeemed: number
  maxRedemptions: number | null
  expiresAt: number | null
  createdAt: number
  isPrivate: boolean
}

const DEFAULT_FORM = {
  code: '',
  discountType: 'percent' as 'percent' | 'amount',
  percentOff: '',
  amountOff: '',
  currency: 'usd',
  maxRedemptions: '',
  expiresAt: '',
  isPrivate: false,
}

export default function PromoCodesManager() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchCodes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/promo-codes')
      if (!res.ok) throw new Error('Failed to load promo codes')
      const data = await res.json()
      setCodes(data.data ?? data)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCodes() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = { code: form.code.toUpperCase() }
      if (form.discountType === 'percent') {
        const pct = Number(form.percentOff)
        if (pct > 0) body.percentOff = pct
      } else {
        const amt = Math.round(Number(form.amountOff) * 100)
        if (amt > 0) {
          body.amountOff = amt
          body.currency = form.currency
        }
      }
      if (form.maxRedemptions) body.maxRedemptions = Number(form.maxRedemptions)
      if (form.expiresAt) body.expiresAt = Math.floor(new Date(form.expiresAt).getTime() / 1000)
      if (form.isPrivate) body.isPrivate = true

      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create promo code')

      toast({ title: 'Promo code created', description: `${form.code.toUpperCase()} is live.` })
      setIsDialogOpen(false)
      setForm(DEFAULT_FORM)
      fetchCodes()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, code: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to deactivate promo code')
      toast({ title: 'Promo code deactivated', description: `${code} is no longer redeemable.` })
      setCodes((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {})
    toast({ title: 'Copied!', description: `${code} copied to clipboard.` })
  }

  const discountLabel = (pc: PromoCode) => {
    if (pc.percentOff != null) return `${pc.percentOff}% off`
    if (pc.amountOff != null) {
      const amount = (pc.amountOff / 100).toFixed(2)
      return `$${amount} ${(pc.currency ?? 'usd').toUpperCase()} off`
    }
    return '—'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Promo Codes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage Stripe promotion codes. Mark a code as private to hide it from the public pricing page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCodes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Code
          </Button>
        </div>
      </div>

      <div className="glass-subtle overflow-hidden rounded-xl border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Redeemed</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            )}
            {!loading && codes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No promo codes yet.
                </TableCell>
              </TableRow>
            )}
            {!loading && codes.map((pc) => (
              <TableRow key={pc.id} className="border-border/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm font-semibold">{pc.code}</code>
                    <button
                      type="button"
                      onClick={() => copyCode(pc.code)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {pc.isPrivate && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 border border-border/40 rounded px-1.5 py-0.5">
                        <EyeOff className="h-2.5 w-2.5" />
                        Private
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    {pc.percentOff != null
                      ? <BadgePercent className="h-3.5 w-3.5 text-primary" />
                      : <DollarSign className="h-3.5 w-3.5 text-primary" />}
                    {discountLabel(pc)}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {pc.timesRedeemed}{pc.maxRedemptions != null ? ` / ${pc.maxRedemptions}` : ''}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {pc.expiresAt ? format(new Date(pc.expiresAt * 1000), 'MMM d, yyyy') : 'Never'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={pc.active
                      ? 'bg-green-500/15 text-green-400 border-green-400/30'
                      : 'bg-muted/30 text-muted-foreground border-border/40'}
                  >
                    {pc.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={deletingId === pc.id || !pc.active}
                    onClick={() => handleDelete(pc.id, pc.code)}
                  >
                    {deletingId === pc.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass border-white/[0.08]">
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
            <DialogDescription>
              Creates a Stripe coupon and attaches a promotion code to it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
                    })
                  }
                  placeholder="SUMMER20"
                  maxLength={50}
                  required
                />
                <p className="text-xs text-muted-foreground">Letters, numbers, hyphens and underscores only.</p>
              </div>

              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v: 'percent' | 'amount') => setForm({ ...form, discountType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage off</SelectItem>
                    <SelectItem value="amount">Fixed amount off</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.discountType === 'percent' ? (
                <div className="space-y-2">
                  <Label htmlFor="percentOff">Percent Off</Label>
                  <Input
                    id="percentOff"
                    type="number"
                    min="1"
                    max="100"
                    value={form.percentOff}
                    onChange={(e) => setForm({ ...form, percentOff: e.target.value })}
                    placeholder="20"
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="amountOff">Amount Off ($)</Label>
                    <Input
                      id="amountOff"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.amountOff}
                      onChange={(e) => setForm({ ...form, amountOff: e.target.value })}
                      placeholder="5.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={form.currency}
                      onValueChange={(v) => setForm({ ...form, currency: v })}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="eur">EUR</SelectItem>
                        <SelectItem value="gbp">GBP</SelectItem>
                        <SelectItem value="cad">CAD</SelectItem>
                        <SelectItem value="aud">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="maxRedemptions">Max Redemptions</Label>
                  <Input
                    id="maxRedemptions"
                    type="number"
                    min="1"
                    value={form.maxRedemptions}
                    onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires On</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="isPrivate" className="text-sm font-medium cursor-pointer">
                    Private code
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Hide from the public Discounts tab on the pricing page.
                  </p>
                </div>
                <Switch
                  id="isPrivate"
                  checked={form.isPrivate}
                  onCheckedChange={(v) => setForm({ ...form, isPrivate: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Code
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
