'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Loader2,
  Plus,
  ServerOff,
  Trash2,
} from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

interface LinodePool {
  id: string
  externalId: string
  label: string
  region: string
  linodeClusterId: string | null
  tier: string
  status: string
  s3Hostname: string
  userBucketCount: number
  createdAt: string
}

interface LinodeCluster {
  id: string
  domain: string
  region: string
  status: string
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-500',
  pending: 'text-yellow-500',
}

export function LinodePoolManager() {
  const { toast } = useToast()
  const [pools, setPools] = useState<LinodePool[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [clusters, setClusters] = useState<LinodeCluster[]>([])
  const [clustersLoading, setClustersLoading] = useState(false)
  const [form, setForm] = useState({
    clusterId: '',
    label: '',
    tier: 'standard',
  })
  const [provisioning, setProvisioning] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/storage/linode')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setPools(data.data ?? [])
    } catch {
      toast({ title: 'Failed to load Linode pools', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openProvision = async () => {
    setForm({ clusterId: '', label: '', tier: 'standard' })
    setDialogOpen(true)
    if (clusters.length === 0) {
      setClustersLoading(true)
      try {
        const res = await fetch('/api/admin/storage/linode?resource=clusters')
        if (!res.ok) throw new Error('Failed to load clusters')
        const data = await res.json()
        setClusters(
          (data.data ?? []).filter(
            (c: LinodeCluster) => c.status === 'available'
          )
        )
      } catch {
        toast({
          title: 'Failed to load Linode clusters',
          variant: 'destructive',
        })
      } finally {
        setClustersLoading(false)
      }
    }
  }

  const handleProvision = async () => {
    if (!form.clusterId || !form.label.trim()) return
    setProvisioning(true)
    try {
      const res = await fetch('/api/admin/storage/linode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterId: form.clusterId,
          label: form.label.trim(),
          tier: form.tier || 'standard',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Failed to provision')
      }
      toast({
        title: 'Linode pool provisioned',
        description: 'Access key created and pool is now active.',
      })
      setDialogOpen(false)
      await refresh()
    } catch (e) {
      toast({
        title: 'Provisioning failed',
        description: (e as Error).message,
        variant: 'destructive',
      })
    } finally {
      setProvisioning(false)
    }
  }

  const handleDelete = (id: string, label: string) => {
    toast({
      title: `Delete "${label}"?`,
      description:
        'This revokes the Linode access key and permanently removes all bucket records.',
      variant: 'destructive',
      action: (
        <ToastAction
          altText="Confirm delete"
          onClick={async () => {
            setDeleting(id)
            try {
              const res = await fetch(
                `/api/admin/storage/linode/${id}?confirm=true`,
                { method: 'DELETE' }
              )
              if (!res.ok) throw new Error('Failed to delete')
              toast({ title: `Pool "${label}" deleted` })
              await refresh()
            } catch {
              toast({
                title: 'Failed to delete pool',
                variant: 'destructive',
              })
            } finally {
              setDeleting(null)
            }
          }}
        >
          Delete
        </ToastAction>
      ),
    })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pools.length === 0
            ? 'No Linode Object Storage pools. Provision one to enable Linode-backed storage.'
            : `${pools.length} pool${pools.length !== 1 ? 's' : ''} — active pools appear on the pricing page.`}
        </p>
        <Button size="sm" onClick={openProvision} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Provision New
        </Button>
      </div>

      {pools.length === 0 && (
        <Alert>
          <ServerOff className="h-4 w-4" />
          <AlertDescription>
            No Linode pools found. Provision one by selecting a cluster and
            creating an access key — Emberly stores the key and uses it for all
            file uploads in that region.
          </AlertDescription>
        </Alert>
      )}

      {pools.length > 0 && (
        <div className="space-y-2">
          {pools.map((pool) => (
            <div
              key={pool.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Cloud className="h-4 w-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{pool.label}</p>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {pool.region}
                  </Badge>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/30">
                    {pool.tier}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span
                    className={`text-xs flex items-center gap-1 ${STATUS_COLORS[pool.status] ?? 'text-muted-foreground'}`}
                  >
                    {pool.status === 'active' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {pool.status}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {pool.s3Hostname}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {pool.userBucketCount} user bucket
                    {pool.userBucketCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:text-destructive shrink-0"
                onClick={() => handleDelete(pool.id, pool.label)}
                disabled={deleting === pool.id}
                title="Delete pool (revokes access key)"
              >
                {deleting === pool.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Provision Linode Object Storage</DialogTitle>
            <DialogDescription>
              Creates a Linode access key for the chosen cluster and saves it as
              a storage pool. Each active pool makes that region available for
              user storage purchases.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Cluster / Region</Label>
              <Select
                value={form.clusterId}
                onValueChange={(v) => setForm((f) => ({ ...f, clusterId: v }))}
                disabled={clustersLoading}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue
                    placeholder={
                      clustersLoading ? 'Loading clusters…' : 'Select a cluster'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id} — {c.domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Pool Label</Label>
              <Input
                placeholder="e.g. emberly-us-east-1"
                className="h-8 text-sm"
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tier</Label>
              <Select
                value={form.tier}
                onValueChange={(v) => setForm((f) => ({ ...f, tier: v }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={provisioning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProvision}
              disabled={provisioning || !form.clusterId || !form.label.trim()}
            >
              {provisioning && (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              )}
              Provision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
