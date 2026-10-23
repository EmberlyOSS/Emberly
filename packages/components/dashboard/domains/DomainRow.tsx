'use client'

import React, { useState } from 'react'
import {
  Check,
  Trash2,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronRight,
  Star,
  ExternalLink,
  AlertCircle,
  Clock,
  Shield,
} from 'lucide-react'
import { SiCloudflare } from 'react-icons/si'
import { Button } from '@/packages/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/packages/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/packages/components/ui/collapsible'
import { Badge } from '@/packages/components/ui/badge'
import { Icons } from '@/packages/components/shared/icons'
import { writeToClipboard } from '@/packages/lib/utils/clipboard'
import { CloudflareSetupDialog } from './CloudflareSetupDialog'
import { Domain, type RequiredDnsRecord } from './types'
import { useToast } from '@/packages/hooks/use-toast'

const RECORD_PURPOSE_LABELS: Record<RequiredDnsRecord['purpose'], string> = {
  routing: 'Required: points your domain at Emberly',
  ownership: 'Required: proves you own the domain',
  certificate: 'Required: issues the TLS certificate',
}

interface Props {
  d: Domain
  rechecking: boolean
  onSetPrimary: (id: string) => void
  onRecheck: (id: string) => void
  onDelete: (id: string) => Promise<void>
}

export default function DomainRow({
  d,
  rechecking,
  onSetPrimary,
  onRecheck,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCfSetup, setShowCfSetup] = useState(false)
  const records: RequiredDnsRecord[] = d.requiredRecords ?? [
    {
      type: 'CNAME',
      name: d.domain,
      value: 'cname.emberly.site',
      purpose: 'routing',
    },
  ]
  const { toast } = useToast()

  const copy = async (text: string, label?: string) => {
    try {
      await writeToClipboard(text)
      toast({
        title: 'Copied!',
        description: label || 'Value copied to clipboard',
      })
    } catch (e) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = () => {
    if (rechecking) {
      return (
        <Badge
          variant="secondary"
          className="gap-1.5 bg-blue-500/10 text-blue-400 border-blue-500/20"
        >
          <Icons.spinner className="h-3 w-3 animate-spin" />
          Verifying
        </Badge>
      )
    }

    if (d.verified) {
      return (
        <Badge
          variant="secondary"
          className="gap-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        >
          <Check className="h-3 w-3" />
          Verified
        </Badge>
      )
    }

    const status = d.cfStatus?.toLowerCase()
    if (status === 'pending') {
      return (
        <Badge
          variant="secondary"
          className="gap-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20"
        >
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      )
    }

    return (
      <Badge
        variant="secondary"
        className="gap-1.5 bg-rose-500/10 text-rose-400 border-rose-500/20"
      >
        <AlertCircle className="h-3 w-3" />
        {d.cfStatus || 'Setup Required'}
      </Badge>
    )
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="p-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-4">
            {/* Domain Info */}
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-3 flex-1 min-w-0 text-left group">
                <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                  {open ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{d.domain}</span>
                    {d.isPrimary && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Star className="h-3 w-3 fill-current" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {d.cfHostnameId
                      ? `ID: ${d.cfHostnameId.slice(0, 12)}...`
                      : 'Awaiting setup'}
                  </p>
                </div>
              </button>
            </CollapsibleTrigger>

            {/* Status Badge */}
            <div className="hidden sm:block">{getStatusBadge()}</div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRecheck(d.id)}
                disabled={rechecking}
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                title="Re-check verification"
              >
                <RefreshCw
                  className={`h-4 w-4 ${rechecking ? 'animate-spin' : ''}`}
                />
              </Button>
              {!d.isPrimary && d.verified && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSetPrimary(d.id)}
                  className="h-8 w-8 hover:bg-amber-500/10 hover:text-amber-500"
                  title="Set as primary"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                title="Delete domain"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Status Badge */}
          <div className="sm:hidden mt-3">{getStatusBadge()}</div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0">
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-4">
              {/* Quick Actions */}
              {d.verified && (
                <div className="flex items-center gap-2 pb-4 border-b border-border/50">
                  <a
                    href={`https://${d.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Visit Domain
                    </Button>
                  </a>
                </div>
              )}

              {/* DNS Configuration */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  DNS Configuration
                </h4>

                <div className="space-y-3">
                  {records.map((r) => (
                    <div
                      key={`${r.type}-${r.name}-${r.value}`}
                      className="glass-subtle p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {r.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {RECORD_PURPOSE_LABELS[r.purpose]}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(
                          [
                            ['Name', r.name],
                            ['Value', r.value],
                          ] as const
                        ).map(([label, value]) => (
                          <div key={label} className="min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">
                              {label}
                            </p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 min-w-0 text-xs font-mono bg-muted/50 px-2 py-1 rounded truncate">
                                {value}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => copy(value, `${label} copied`)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {!d.verified && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <p className="text-sm text-muted-foreground">
                        Add these records at your DNS provider (CNAME set to DNS
                        only, not proxied), then refresh to verify.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-2"
                        onClick={() => setShowCfSetup(true)}
                      >
                        <SiCloudflare className="h-4 w-4 text-[#F38020]" />
                        Set up with Cloudflare
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <CloudflareSetupDialog
        domainId={d.id}
        domain={d.domain}
        open={showCfSetup}
        onOpenChange={setShowCfSetup}
        onConfigured={() => onRecheck(d.id)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Domain</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{d.domain}</strong>? This
              action cannot be undone and will remove all associated DNS
              configurations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true)
                await onDelete(d.id)
                setDeleting(false)
                setShowDeleteDialog(false)
              }}
            >
              {deleting ? (
                <>
                  <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Domain'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
