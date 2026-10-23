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

interface OVHPool {
  id: string
  externalId: string
  label: string
  region: string
  projectId: string | null
  regionName: string | null
  tier: string
  status: string
  s3Hostname: string
  userBucketCount: number
  createdAt: string
}

interface OVHProject {
  id: string
  description: string
  status: string
}

interface OVHRegion {
  name: string
  status: string
  datacenterLocation: string
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-500',
  pending: 'text-yellow-500',
}

const TIER_COLORS: Record<string, string> = {
  standard: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  high_performance: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
}

export function OVHCloudPoolManager() {
  const { toast } = useToast()
  const [pools, setPools] = useState<OVHPool[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [projects, setProjects] = useState<OVHProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [regions, setRegions] = useState<OVHRegion[]>([])
  const [regionsLoading, setRegionsLoading] = useState(false)
  const [form, setForm] = useState({
    projectId: '',
    regionName: '',
    label: '',
    tier: 'standard' as 'standard' | 'high_performance',
  })
  const [provisioning, setProvisioning] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/storage/ovhcloud')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setPools(data.data ?? [])
    } catch {
      toast({ title: 'Failed to load OVHcloud pools', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openProvision = async () => {
    setForm({ projectId: '', regionName: '', label: '', tier: 'standard' })
    setRegions([])
    setDialogOpen(true)
    if (projects.length === 0) {
      setProjectsLoading(true)
      try {
        const res = await fetch('/api/admin/storage/ovhcloud?resource=projects')
        if (!res.ok) throw new Error('Failed to load projects')
        const data = await res.json()
        setProjects(
          (data.data ?? []).filter((p: OVHProject) => p.status === 'ok')
        )
      } catch {
        toast({
          title: 'Failed to load OVHcloud projects',
          variant: 'destructive',
        })
      } finally {
        setProjectsLoading(false)
      }
    }
  }

  const handleProjectChange = async (projectId: string) => {
    setForm((f) => ({ ...f, projectId, regionName: '' }))
    setRegions([])
    if (!projectId) return
    setRegionsLoading(true)
    try {
      const res = await fetch(
        `/api/admin/storage/ovhcloud?resource=regions&projectId=${encodeURIComponent(projectId)}`
      )
      if (!res.ok) throw new Error('Failed to load regions')
      const data = await res.json()
      setRegions((data.data ?? []).filter((r: OVHRegion) => r.status === 'UP'))
    } catch {
      toast({
        title: 'Failed to load regions for this project',
        variant: 'destructive',
      })
    } finally {
      setRegionsLoading(false)
    }
  }

  const handleProvision = async () => {
    if (!form.projectId || !form.regionName || !form.label.trim()) return
    setProvisioning(true)
    try {
      const res = await fetch('/api/admin/storage/ovhcloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: form.projectId,
          regionName: form.regionName,
          label: form.label.trim(),
          tier: form.tier,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Failed to provision')
      }
      toast({
        title: 'OVHcloud pool provisioned',
        description: 'S3 credentials created and pool is now active.',
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
        'This revokes the OVHcloud S3 credentials and permanently removes all bucket records.',
      variant: 'destructive',
      action: (
        <ToastAction
          altText="Confirm delete"
          onClick={async () => {
            setDeleting(id)
            try {
              const res = await fetch(
                `/api/admin/storage/ovhcloud/${id}?confirm=true`,
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
            ? 'No OVHcloud Object Storage pools. Provision one to enable OVH-backed storage.'
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
            No OVHcloud pools found. Select a Public Cloud project and region to
            generate S3 credentials — Emberly will use these for all file
            uploads in that region.
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
                    {pool.regionName ?? pool.region}
                  </Badge>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${TIER_COLORS[pool.tier] ?? 'bg-muted/30 text-muted-foreground border-border/40'}`}
                  >
                    {pool.tier === 'high_performance' ? 'High Perf' : pool.tier}
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
                title="Delete pool (revokes S3 credentials)"
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
            <DialogTitle>Provision OVHcloud Object Storage</DialogTitle>
            <DialogDescription>
              Generates S3-compatible credentials for a Public Cloud project and
              region, then saves it as a storage pool. Users can purchase
              storage in active pool regions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Public Cloud Project</Label>
              <Select
                value={form.projectId}
                onValueChange={handleProjectChange}
                disabled={projectsLoading}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue
                    placeholder={
                      projectsLoading ? 'Loading projects…' : 'Select a project'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.description || p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Region</Label>
              {!form.projectId ? (
                <p className="text-xs text-muted-foreground italic px-0.5">
                  Select a project above to see available regions.
                </p>
              ) : regionsLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading regions…
                </div>
              ) : (
                <Select
                  value={form.regionName}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, regionName: v }))
                  }
                  disabled={regions.length === 0}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue
                      placeholder={
                        regions.length === 0
                          ? 'No available regions'
                          : 'Select a region'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.name} value={r.name}>
                        {r.name}
                        {r.datacenterLocation
                          ? ` — ${r.datacenterLocation}`
                          : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Pool Label</Label>
              <Input
                placeholder="e.g. emberly-ovh-gra"
                className="h-8 text-sm"
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Storage Class</Label>
              <Select
                value={form.tier}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    tier: v as 'standard' | 'high_performance',
                  }))
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high_performance">
                    High Performance
                  </SelectItem>
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
              disabled={
                provisioning ||
                !form.projectId ||
                !form.regionName ||
                !form.label.trim()
              }
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
