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
import { Domain } from './types'
import { useToast } from '@/packages/hooks/use-toast'

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
  const { toast } = useToast()

  const copy = async (text: string, label?: string) => {
    try {
      await writeToClipboard(text)
      toast({ title: 'Copied!', description: label || 'Value copied to clipboard' })
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
        <Badge variant="secondary" className="gap-1.5 bg-blue-500/10 text-blue-400 border-blue-500/20">
          <Icons.spinner className="h-3 w-3 animate-spin" />
          Verifying
        </Badge>
      )
    }

    if (d.verified) {
      return (
        <Badge variant="secondary" className="gap-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          <Check className="h-3 w-3" />
          Verified
        </Badge>
      )
    }

    const status = d.cfStatus?.toLowerCase()
    if (status === 'pending') {
      return (
        <Badge variant="secondary" className="gap-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="gap-1.5 bg-rose-500/10 text-rose-400 border-rose-500/20">
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
                    {d.cfHostnameId ? `ID: ${d.cfHostnameId.slice(0, 12)}...` : 'Awaiting setup'}
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
                <RefreshCw className={`h-4 w-4 ${rechecking ? 'animate-spin' : ''}`} />
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
                  {/* Required CNAME */}
                  <div className="rounded-lg bg-background/50 border border-border/50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">CNAME</Badge>
                        <span className="text-xs text-muted-foreground">Required</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Name / Host</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono bg-muted/50 px-2 py-1 rounded truncate">
                            @ or www
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => copy('@', 'Host copied')}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Target / Value</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono bg-muted/50 px-2 py-1 rounded truncate">
                            cname.emberly.site
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => copy('cname.emberly.site', 'Target copied')}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ownership Verification TXT */}
                  {d.cfMeta?.ownership_verification && (
                    <div className="rounded-lg bg-background/50 border border-border/50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">TXT</Badge>
                          <span className="text-xs text-muted-foreground">Ownership Verification</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Name</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs font-mono bg-muted/50 px-2 py-1 rounded truncate">
                              {d.cfMeta.ownership_verification?.txt_name ||
                                d.cfMeta.ownership_verification?.name ||
                                '@'}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() =>
                                copy(
                                  d.cfMeta.ownership_verification?.txt_name ||
                                  d.cfMeta.ownership_verification?.name ||
                                  '@',
                                  'Name copied'
                                )
                              }
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Value</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs font-mono bg-muted/50 px-2 py-1 rounded truncate">
                              {d.cfMeta.ownership_verification?.txt_value ||
                                d.cfMeta.ownership_verification?.value ||
                                ''}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() =>
                                copy(
                                  d.cfMeta.ownership_verification?.txt_value ||
                                  d.cfMeta.ownership_verification?.value ||
                                  '',
                                  'Value copied'
                                )
                              }
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Validation Records */}
                  {Array.isArray(d.cfMeta?.validation_records) &&
                    d.cfMeta.validation_records.map((r: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-lg bg-background/50 border border-border/50 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {(r.type || 'TXT').toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Validation Record</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Name</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-xs font-mono bg-muted/50 px-2 py-1 rounded truncate">
                                {r.txt_name || r.name || '@'}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => copy(r.txt_name || r.name || '@', 'Name copied')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Value</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-xs font-mono bg-muted/50 px-2 py-1 rounded truncate">
                                {r.txt_value || r.value || ''}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => copy(r.txt_value || r.value || '', 'Value copied')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* No metadata yet */}
                  {!d.cfMeta && !d.verified && (
                    <p className="text-sm text-muted-foreground">
                      Add the CNAME record above, then click the refresh button to check verification
                      status.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Domain</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{d.domain}</strong>? This action cannot be
              undone and will remove all associated DNS configurations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
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
