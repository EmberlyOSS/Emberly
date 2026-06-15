'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  HardDrive,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  Users,
  X,
} from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

interface StorageBucket {
  id: string
  name: string
  provider: string
  isCore: boolean
  priority: number
  fileCount: number
  provisionStatus: string
  s3Bucket: string
  s3Region: string
  s3AccessKeyId: string
  s3Endpoint: string | null
  s3ForcePathStyle: boolean
  vultrObjectStorageId: string | null
  vultrBucketName: string | null
  createdAt: string
  updatedAt: string
  _count: { assignedUsers: number; assignedSquads: number; files: number }
}

interface VultrInstance {
  id: string
  label: string
  region: string
  tier: string
  status: string
  s3Hostname: string
  userBucketCount: number
}

interface BucketForm {
  name: string
  provider: string
  isCore: boolean
  priority: number
  s3Bucket: string
  s3Region: string
  s3AccessKeyId: string
  s3SecretKey: string
  s3Endpoint: string
  s3ForcePathStyle: boolean
  vultrObjectStorageId: string
  vultrBucketName: string
}

const EMPTY_FORM: BucketForm = {
  name: '',
  provider: 'vultr',
  isCore: false,
  priority: 0,
  s3Bucket: '',
  s3Region: '',
  s3AccessKeyId: '',
  s3SecretKey: '',
  s3Endpoint: '',
  s3ForcePathStyle: false,
  vultrObjectStorageId: '',
  vultrBucketName: '',
}

interface TestState {
  loading: boolean
  ok?: boolean
  message?: string
  detail?: string
}

function ProvisionStatusBadge({ status }: { status: string }) {
  if (status === 'active') return null
  const map: Record<string, string> = {
    provisioning: 'bg-yellow-500/15 text-yellow-400 border-yellow-400/30',
    deprovisioning: 'bg-red-500/15 text-red-400 border-red-400/30',
  }
  return (
    <Badge
      className={`text-[10px] py-0 border ${map[status] ?? 'bg-muted/50 text-muted-foreground border-border'}`}
    >
      {status}
    </Badge>
  )
}

export function StorageBucketManager() {
  const { toast } = useToast()
  const [buckets, setBuckets] = useState<StorageBucket[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BucketForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [testStates, setTestStates] = useState<Record<string, TestState>>({})
  const [vultrInstances, setVultrInstances] = useState<VultrInstance[]>([])
  const [vultrLoading, setVultrLoading] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/storage/buckets')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setBuckets(data.data ?? [])
    } catch {
      toast({ title: 'Failed to load storage buckets', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    refresh()
  }, [refresh])

  const fetchVultrInstances = useCallback(async () => {
    setVultrLoading(true)
    try {
      const res = await fetch('/api/admin/storage/vultr')
      if (!res.ok) throw new Error('Failed to load Vultr instances')
      const data = await res.json()
      setVultrInstances(data.data ?? [])
    } catch {
      // Non-fatal — admin can still use manual S3
    } finally {
      setVultrLoading(false)
    }
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
    if (vultrInstances.length === 0) fetchVultrInstances()
  }

  const openEdit = (bucket: StorageBucket) => {
    setEditingId(bucket.id)
    setForm({
      name: bucket.name,
      provider: bucket.vultrObjectStorageId ? 'vultr' : bucket.provider,
      isCore: bucket.isCore,
      priority: bucket.priority ?? 0,
      s3Bucket: bucket.s3Bucket,
      s3Region: bucket.s3Region,
      s3AccessKeyId: '',
      s3SecretKey: '',
      s3Endpoint: bucket.s3Endpoint ?? '',
      s3ForcePathStyle: bucket.s3ForcePathStyle,
      vultrObjectStorageId: bucket.vultrObjectStorageId ?? '',
      vultrBucketName: bucket.vultrBucketName ?? '',
    })
    setDialogOpen(true)
    if (vultrInstances.length === 0) fetchVultrInstances()
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId
        ? `/api/admin/storage/buckets/${editingId}`
        : '/api/admin/storage/buckets'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: editingId ? 'Bucket updated' : 'Bucket created' })
      setDialogOpen(false)
      refresh()
    } catch {
      toast({ title: 'Failed to save bucket', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string, name: string) => {
    toast({
      title: `Delete "${name}"?`,
      description:
        'Users and squads assigned to it will fall back to the default storage.',
      variant: 'destructive',
      action: (
        <ToastAction
          altText="Confirm delete"
          onClick={async () => {
            setDeleting(id)
            try {
              const res = await fetch(`/api/admin/storage/buckets/${id}`, {
                method: 'DELETE',
              })
              if (!res.ok) throw new Error('Failed to delete')
              toast({ title: `Bucket "${name}" deleted` })
              refresh()
            } catch {
              toast({
                title: 'Failed to delete bucket',
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

  const handleTest = async (id: string) => {
    setTestStates((s) => ({ ...s, [id]: { loading: true } }))
    try {
      const res = await fetch(`/api/admin/storage/buckets/${id}/test`, {
        method: 'POST',
      })
      const data = await res.json()
      setTestStates((s) => ({
        ...s,
        [id]: {
          loading: false,
          ok: data?.data?.ok,
          message: data?.data?.message,
          detail: data?.data?.detail,
        },
      }))
    } catch {
      setTestStates((s) => ({
        ...s,
        [id]: { loading: false, ok: false, message: 'Request failed' },
      }))
    }
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
          {buckets.length === 0
            ? 'No additional storage buckets configured.'
            : `${buckets.length} bucket${buckets.length !== 1 ? 's' : ''} configured`}
        </p>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Bucket
        </Button>
      </div>

      {buckets.length > 0 && (
        <div className="space-y-2">
          {buckets.map((bucket) => {
            const test = testStates[bucket.id]
            return (
              <div
                key={bucket.id}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  {bucket.isCore ? (
                    <Layers className="h-4 w-4 text-primary" />
                  ) : bucket.provider === 's3' ? (
                    <Cloud className="h-4 w-4 text-primary" />
                  ) : (
                    <Server className="h-4 w-4 text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">
                      {bucket.name}
                    </p>
                    {bucket.isCore ? (
                      <Badge className="bg-violet-500/15 text-violet-400 border border-violet-400/30 text-[10px] py-0 shrink-0">
                        Core Pool
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-[10px] py-0 shrink-0"
                      >
                        Dedicated
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className="text-[10px] py-0 shrink-0"
                    >
                      {bucket.vultrObjectStorageId
                        ? 'Vultr'
                        : bucket.provider === 's3'
                          ? 'S3'
                          : 'Local'}
                    </Badge>
                    <ProvisionStatusBadge status={bucket.provisionStatus} />
                    {bucket.s3Bucket && (
                      <span className="text-xs text-muted-foreground font-mono truncate hidden sm:block">
                        {bucket.s3Bucket}
                        {bucket.s3Region ? ` · ${bucket.s3Region}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {bucket._count.assignedUsers} user
                      {bucket._count.assignedUsers !== 1 ? 's' : ''}
                      {bucket._count.assignedSquads > 0 &&
                        `, ${bucket._count.assignedSquads} squad${bucket._count.assignedSquads !== 1 ? 's' : ''}`}
                    </span>
                    {bucket.isCore && (
                      <>
                        <span className="text-xs text-muted-foreground">
                          {bucket.fileCount.toLocaleString()} file
                          {bucket.fileCount !== 1 ? 's' : ''}
                        </span>
                        {bucket.priority !== 0 && (
                          <span className="text-xs text-muted-foreground">
                            priority {bucket.priority}
                          </span>
                        )}
                      </>
                    )}
                    {test && !test.loading && (
                      <span
                        className={`text-xs flex items-center gap-1 ${test.ok ? 'text-green-500' : 'text-destructive'}`}
                        title={test.detail}
                      >
                        {test.ok ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {test.message}
                        {test.detail ? ` — ${test.detail}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleTest(bucket.id)}
                    disabled={test?.loading}
                    title="Test connection"
                  >
                    {test?.loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => openEdit(bucket)}
                    title="Edit bucket"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:text-destructive"
                    onClick={() => handleDelete(bucket.id, bucket.name)}
                    disabled={deleting === bucket.id}
                    title="Delete bucket"
                  >
                    {deleting === bucket.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Storage Bucket' : 'Add Storage Bucket'}
            </DialogTitle>
            <DialogDescription>
              Named S3 buckets can be assigned to specific users or squads as
              their dedicated storage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Bucket Name</Label>
              <Input
                placeholder="e.g. Team Alpha, EU Region, Media Bucket"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            {/* Core pool toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3 bg-muted/20">
              <div>
                <p className="text-sm font-medium">Core Pool Bucket</p>
                <p className="text-xs text-muted-foreground">
                  Core buckets are shared across all users via load balancing.
                  Dedicated buckets are assigned to specific users or squads.
                </p>
              </div>
              <Switch
                checked={form.isCore}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isCore: v }))}
              />
            </div>

            {/* Priority — only relevant for core buckets */}
            {form.isCore && (
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      priority: parseInt(e.target.value) || 0,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Higher number = more preferred. When two core buckets have the
                  same file count, the one with the higher priority wins.
                  Default is 0 (no preference). Example: set a low-latency
                  bucket to 10 and leave others at 0.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={form.provider}
                onValueChange={(v) => setForm((f) => ({ ...f, provider: v }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vultr">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-3.5 w-3.5" />
                      Vultr Object Storage
                    </div>
                  </SelectItem>
                  <SelectItem value="s3">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-3.5 w-3.5" />
                      S3 (manual)
                    </div>
                  </SelectItem>
                  <SelectItem value="local">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-3.5 w-3.5" />
                      Local
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.provider === 'vultr' && (
              <div className="space-y-3 rounded-xl border border-border/40 p-4 bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Cloud className="h-3.5 w-3.5" />
                  Vultr Instance
                </p>

                <div className="space-y-1.5">
                  <Label className="text-xs">Object Storage Instance</Label>
                  <Select
                    value={form.vultrObjectStorageId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, vultrObjectStorageId: v }))
                    }
                    disabled={!!editingId || vultrLoading}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue
                        placeholder={
                          vultrLoading
                            ? 'Loading instances…'
                            : 'Select an instance'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {vultrInstances.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          <div className="flex items-center gap-2">
                            <span>{inst.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {inst.region} · {inst.tier}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {vultrInstances.length === 0 && !vultrLoading && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No Vultr instances provisioned yet
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {editingId && (
                    <p className="text-xs text-muted-foreground">
                      Instance cannot be changed after creation.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Bucket Name (within the instance)
                  </Label>
                  <Input
                    placeholder="e.g. user-uploads"
                    className="h-8 text-sm font-mono"
                    value={form.vultrBucketName}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        vultrBucketName: e.target.value,
                      }))
                    }
                    disabled={!!editingId}
                  />
                  {editingId ? (
                    <p className="text-xs text-muted-foreground">
                      Bucket name cannot be changed after creation.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Must match an existing bucket in the selected Vultr
                      instance. Credentials are filled automatically.
                    </p>
                  )}
                </div>
              </div>
            )}

            {form.provider === 's3' && (
              <div className="space-y-3 rounded-xl border border-border/40 p-4 bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Cloud className="h-3.5 w-3.5" />
                  S3 Configuration
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Bucket Name</Label>
                    <Input
                      placeholder="my-bucket"
                      className="h-8 text-sm"
                      value={form.s3Bucket}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, s3Bucket: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Region</Label>
                    <Input
                      placeholder="us-east-1"
                      className="h-8 text-sm"
                      value={form.s3Region}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, s3Region: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Access Key ID</Label>
                    <Input
                      type="password"
                      placeholder={editingId ? '(unchanged)' : 'AKIA...'}
                      className="h-8 text-sm font-mono"
                      value={form.s3AccessKeyId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          s3AccessKeyId: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Secret Access Key</Label>
                    <Input
                      type="password"
                      placeholder={editingId ? '(unchanged)' : '••••••••'}
                      className="h-8 text-sm font-mono"
                      value={form.s3SecretKey}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, s3SecretKey: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Custom Endpoint (optional)</Label>
                  <Input
                    placeholder="https://s3.custom-domain.com"
                    className="h-8 text-sm"
                    value={form.s3Endpoint}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, s3Endpoint: e.target.value }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">Force Path Style</p>
                    <p className="text-xs text-muted-foreground">
                      Required for MinIO, DigitalOcean Spaces, etc.
                    </p>
                  </div>
                  <Switch
                    checked={form.s3ForcePathStyle}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, s3ForcePathStyle: v }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create Bucket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
