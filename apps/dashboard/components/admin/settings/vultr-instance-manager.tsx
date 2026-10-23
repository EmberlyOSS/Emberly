'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  DollarSign,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  ServerOff,
  Trash2,
  Zap,
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
import * as Flags from 'country-flag-icons/react/3x2'

const REGION_META: Record<string, { city: string; countryCode: string }> = {
  ewr: { city: 'New York', countryCode: 'US' },
  ord: { city: 'Chicago', countryCode: 'US' },
  lax: { city: 'Los Angeles', countryCode: 'US' },
  sea: { city: 'Seattle', countryCode: 'US' },
  atl: { city: 'Atlanta', countryCode: 'US' },
  mia: { city: 'Miami', countryCode: 'US' },
  dfw: { city: 'Dallas', countryCode: 'US' },
  ams: { city: 'Amsterdam', countryCode: 'NL' },
  lhr: { city: 'London', countryCode: 'GB' },
  fra: { city: 'Frankfurt', countryCode: 'DE' },
  par: { city: 'Paris', countryCode: 'FR' },
  mad: { city: 'Madrid', countryCode: 'ES' },
  waw: { city: 'Warsaw', countryCode: 'PL' },
  sgp: { city: 'Singapore', countryCode: 'SG' },
  syd: { city: 'Sydney', countryCode: 'AU' },
  nrt: { city: 'Tokyo', countryCode: 'JP' },
  itm: { city: 'Osaka', countryCode: 'JP' },
  bom: { city: 'Mumbai', countryCode: 'IN' },
  blr: { city: 'Bangalore', countryCode: 'IN' },
  del: { city: 'Delhi', countryCode: 'IN' },
  jnb: { city: 'Johannesburg', countryCode: 'ZA' },
  mex: { city: 'Mexico City', countryCode: 'MX' },
  sao: { city: 'São Paulo', countryCode: 'BR' },
  yto: { city: 'Toronto', countryCode: 'CA' },
  sjc: { city: 'Silicon Valley', countryCode: 'US' },
}

function RegionLabel({ code }: { code: string }) {
  const meta = REGION_META[code.toLowerCase()]
  if (!meta) return <span>{code.toUpperCase()}</span>
  const FlagIcon = (Flags as any)[meta.countryCode] as
    | React.ComponentType<React.SVGProps<SVGSVGElement>>
    | undefined
  return (
    <span className="inline-flex items-center gap-1.5">
      {FlagIcon && <FlagIcon className="h-3 w-4 shrink-0 rounded-sm" />}
      {meta.city}
    </span>
  )
}

interface VultrInstance {
  id: string
  externalId: string
  label: string
  region: string
  tier: string
  status: string
  s3Hostname: string
  cfHostname: string | null
  userBucketCount: number
  createdAt: string
}

interface VultrCluster {
  id: number
  region: string
  hostname: string
  deploy: 'yes' | 'no'
}

interface VultrTier {
  id: number
  sales_name: string
  sales_desc: string
  price: number
  is_default: 'yes' | 'no'
  slug: string
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-500',
  pending: 'text-yellow-500',
}

// Specs shown to admins in the tier picker — matches what Vultr actually delivers
const TIER_SPECS: Record<
  string,
  { specs: string[]; badge: string; badgeColor: string }
> = {
  archival: {
    specs: [
      '1 TB archived + 100 GB unarchived',
      '1 TB bandwidth',
      'Lifecycle policy support',
      'Cold/infrequent access optimised',
    ],
    badge: 'Archival',
    badgeColor: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  },
  standard: {
    specs: [
      '1 TB storage + 1 TB bandwidth',
      '800 IOPS / 600 Mbps',
      'HDD+SSD indexed',
      'General-purpose workloads',
    ],
    badge: 'Standard',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  },
  premium: {
    specs: [
      '1 TB storage + 1 TB bandwidth',
      '1,000 IOPS / 800 Mbps',
      'HDD+SSD indexed',
      'Mixed read/write workloads',
    ],
    badge: 'Premium',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  },
  performance: {
    specs: [
      'NVMe storage + 1 TB bandwidth',
      '4,000 IOPS / 1 Gbps',
      'Low-latency NVMe',
      'Datacenter-grade workloads',
    ],
    badge: 'Performance',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  },
  accelerated: {
    specs: [
      'NVMe storage + 5 TB bandwidth',
      '10,000 IOPS / 5 Gbps',
      'NVMe write-intensive',
      'Highest performance tier',
    ],
    badge: 'Accelerated',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
  },
}

function getTierMeta(salesName: string, slug?: string) {
  const key = (slug ?? salesName).toLowerCase()
  for (const [k, v] of Object.entries(TIER_SPECS)) {
    if (key.includes(k)) return v
  }
  return {
    specs: [],
    badge: salesName,
    badgeColor: 'bg-muted/30 text-muted-foreground border-border/40',
  }
}

export function VultrInstanceManager() {
  const { toast } = useToast()
  const [instances, setInstances] = useState<VultrInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [clusters, setClusters] = useState<VultrCluster[]>([])
  const [clustersLoading, setClustersLoading] = useState(false)
  const [form, setForm] = useState({ clusterId: '', label: '', tierId: '' })
  const [provisioning, setProvisioning] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [tiers, setTiers] = useState<VultrTier[]>([])
  const [tiersLoading, setTiersLoading] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/storage/vultr')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setInstances(data.data ?? [])
    } catch {
      toast({ title: 'Failed to load Vultr instances', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/storage/vultr/sync', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Sync failed')
      const data = await res.json()
      const { imported, updated, skipped } = data.data ?? {}
      const changed = (imported ?? 0) + (updated ?? 0)
      toast({
        title:
          changed > 0
            ? [
                imported > 0 &&
                  `${imported} new instance${imported !== 1 ? 's' : ''} imported`,
                updated > 0 && `${updated} updated`,
              ]
                .filter(Boolean)
                .join(', ')
            : 'Already up to date',
        description:
          changed > 0
            ? `${skipped} instance${skipped !== 1 ? 's' : ''} already up to date.`
            : `All ${skipped} Vultr instance${skipped !== 1 ? 's' : ''} are already in the database.`,
      })
      await refresh()
    } catch {
      toast({
        title: 'Sync failed',
        description:
          'Check that a Vultr API key is configured under Integrations.',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  const openProvision = async () => {
    setForm({ clusterId: '', label: '', tierId: '' })
    setTiers([])
    setDialogOpen(true)
    if (clusters.length === 0) {
      setClustersLoading(true)
      try {
        const res = await fetch('/api/admin/storage/vultr?resource=clusters')
        if (!res.ok) throw new Error('Failed to load clusters')
        const data = await res.json()
        setClusters(
          (data.data ?? []).filter((c: VultrCluster) => c.deploy === 'yes')
        )
      } catch {
        toast({
          title: 'Failed to load Vultr clusters',
          variant: 'destructive',
        })
      } finally {
        setClustersLoading(false)
      }
    }
  }

  const handleClusterChange = async (clusterId: string) => {
    setForm((f) => ({ ...f, clusterId, tierId: '' }))
    setTiers([])
    if (!clusterId) return
    setTiersLoading(true)
    try {
      const res = await fetch(
        `/api/admin/storage/vultr?resource=tiers&clusterId=${clusterId}`
      )
      if (!res.ok) throw new Error('Failed to load tiers')
      const data = await res.json()
      const fetchedTiers: VultrTier[] = data.data ?? []
      setTiers(fetchedTiers)
      // Auto-select the default tier
      const defaultTier =
        fetchedTiers.find((t) => t.is_default === 'yes') ?? fetchedTiers[0]
      if (defaultTier)
        setForm((f) => ({ ...f, tierId: String(defaultTier.id) }))
    } catch {
      toast({
        title: 'Failed to load tiers for this cluster',
        variant: 'destructive',
      })
    } finally {
      setTiersLoading(false)
    }
  }

  const handleProvision = async () => {
    if (!form.clusterId || !form.tierId || !form.label.trim()) return
    setProvisioning(true)
    try {
      const res = await fetch('/api/admin/storage/vultr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterId: parseInt(form.clusterId),
          tierId: parseInt(form.tierId),
          label: form.label.trim(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Failed to provision')
      }
      toast({
        title: 'Instance provisioned',
        description: 'It will become active within a few minutes.',
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
        'This permanently destroys all buckets and user data inside it.',
      variant: 'destructive',
      action: (
        <ToastAction
          altText="Confirm delete"
          onClick={async () => {
            setDeleting(id)
            try {
              const res = await fetch(
                `/api/admin/storage/vultr/${id}?confirm=true`,
                { method: 'DELETE' }
              )
              if (!res.ok) throw new Error('Failed to delete')
              toast({ title: `Instance "${label}" deleted` })
              await refresh()
            } catch {
              toast({
                title: 'Failed to delete instance',
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
          {instances.length === 0
            ? 'No Vultr Object Storage instances tracked. Sync to import existing ones.'
            : `${instances.length} instance${instances.length !== 1 ? 's' : ''} — active regions appear on the pricing page.`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            className="gap-1.5"
            title="Import instances from your Vultr account that are not yet in the database"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sync from Vultr
          </Button>
          <Button size="sm" onClick={openProvision} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Provision New
          </Button>
        </div>
      </div>

      {instances.length === 0 && (
        <Alert>
          <ServerOff className="h-4 w-4" />
          <AlertDescription>
            No instances found. If you already created one on the Vultr
            dashboard, click <strong>Sync from Vultr</strong> to import it.
            Active instances make their region available on the pricing page so
            users can purchase storage.
          </AlertDescription>
        </Alert>
      )}

      {instances.length > 0 && (
        <div className="space-y-2">
          {instances.map((inst) => (
            <div
              key={inst.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Cloud className="h-4 w-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{inst.label}</p>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    <RegionLabel code={inst.region} />
                  </Badge>
                  {(() => {
                    const meta = getTierMeta(inst.tier)
                    return (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${meta.badgeColor}`}
                      >
                        <Zap className="h-2.5 w-2.5" />
                        {meta.badge}
                      </span>
                    )
                  })()}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span
                    className={`text-xs flex items-center gap-1 ${STATUS_COLORS[inst.status] ?? 'text-muted-foreground'}`}
                  >
                    {inst.status === 'active' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {inst.status}
                  </span>
                  {inst.cfHostname ? (
                    <a
                      href={`https://${inst.cfHostname}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline font-mono"
                    >
                      {inst.cfHostname}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">
                      {inst.s3Hostname}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {inst.userBucketCount} user bucket
                    {inst.userBucketCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:text-destructive shrink-0"
                onClick={() => handleDelete(inst.id, inst.label)}
                disabled={deleting === inst.id}
                title="Delete instance (destroys all user data)"
              >
                {deleting === inst.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Provision New Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Provision Vultr Object Storage</DialogTitle>
            <DialogDescription>
              Creates a new pooled Object Storage instance on your Vultr
              account. Each active instance makes that region &amp; tier
              available on the pricing page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Region / Cluster</Label>
              <Select
                value={form.clusterId}
                onValueChange={handleClusterChange}
                disabled={clustersLoading}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue
                    placeholder={
                      clustersLoading ? 'Loading clusters…' : 'Select a region'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <RegionLabel code={c.region} /> — {c.hostname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Instance Label</Label>
              <Input
                placeholder="e.g. emberly-ewr-standard"
                className="h-8 text-sm"
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Storage Tier</Label>
              {!form.clusterId ? (
                <p className="text-xs text-muted-foreground italic px-0.5">
                  Select a cluster above to see available tiers.
                </p>
              ) : tiersLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading tiers…
                </div>
              ) : tiers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-0.5">
                  No tiers available for this cluster.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {tiers.map((t) => {
                    const meta = getTierMeta(t.sales_name, t.slug)
                    const isSelected = form.tierId === String(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, tierId: String(t.id) }))
                        }
                        className={`text-left rounded-lg border px-3 py-2.5 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                            : 'border-border/50 bg-background/30 hover:border-primary/30 hover:bg-primary/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Zap
                              className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                            />
                            <span className="text-sm font-semibold">
                              {t.sales_name}
                            </span>
                            {t.is_default === 'yes' && (
                              <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1 rounded">
                                default
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <DollarSign className="h-3 w-3 text-amber-500" />
                            <span className="text-sm font-bold text-amber-500">
                              {t.price}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              /mo (Vultr cost)
                            </span>
                          </div>
                        </div>
                        <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {meta.specs.map((s) => (
                            <li
                              key={s}
                              className="text-xs text-muted-foreground flex items-center gap-1"
                            >
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {form.tierId &&
              (() => {
                const selected = tiers.find((t) => String(t.id) === form.tierId)
                return selected ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      Vultr will charge your account{' '}
                      <strong>${selected.price}/month</strong> for this
                      instance. This is your infrastructure cost — separate from
                      what users pay on the pricing page.
                    </span>
                  </div>
                ) : null
              })()}
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
                !form.clusterId ||
                !form.tierId ||
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
