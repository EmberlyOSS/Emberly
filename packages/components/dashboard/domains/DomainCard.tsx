"use client"

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Check, Trash2 } from 'lucide-react'
import { Button } from '@/packages/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/packages/components/ui/collapsible'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/packages/components/ui/dialog'
import { Icons } from '@/packages/components/shared/icons'
import { writeToClipboard } from '@/packages/lib/utils/clipboard'
import { Domain } from './types'
import { useToast } from '@/packages/hooks/use-toast'

interface Props {
  d: Domain
  isOpen: boolean
  onToggle: () => void
  onSetPrimary: (id: string) => void
  onRecheck: (id: string) => void
  onDelete: (id: string) => Promise<void>
  rechecking: boolean
}

export default function DomainCard({ d, isOpen, onToggle, onSetPrimary, onRecheck, onDelete, rechecking }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const { toast } = useToast()


  const copy = async (text: string) => {
    try {
      await writeToClipboard(text)
      toast({ title: 'Copied', description: 'Value copied to clipboard' })
    } catch (e) {
      toast({ title: 'Copy failed', description: 'Could not copy to clipboard', variant: 'destructive' })
    }
  }

  return (
    <div className="relative rounded-2xl bg-gradient-to-tr from-white/3 to-black/6 dark:from-white/6 dark:to-black/8 border border-white/6 dark:border-white/8 backdrop-blur-md shadow-2xl overflow-hidden p-4 transition-transform hover:-translate-y-1 hover:shadow-2xl">
      <div className="absolute -left-0 top-0 bottom-0 w-1 rounded-r-full bg-gradient-to-b from-violet-400 to-emerald-400 opacity-95 pointer-events-none" />
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="font-extrabold text-sm sm:text-lg leading-tight text-foreground">{d.domain}</div>
              <div className="hidden sm:flex items-center gap-2">
                {d.isPrimary && <span className="text-xs text-muted-foreground">• Primary</span>}
                {rechecking ? (
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-gradient-to-r from-blue-600/10 to-indigo-600/10 text-blue-400">
                    <Icons.spinner className="h-3 w-3 animate-spin" />
                    Checking
                  </span>
                ) : d.verified ? (
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-emerald-700/10 text-emerald-200">
                    <Check className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-rose-600/10 text-rose-300">
                    <Icons.alertCircle className="h-3 w-3" />
                    Unverified
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1 truncate">{d.cfHostnameId ? `Cloudflare hostname: ${d.cfHostnameId}` : 'Not yet provisioned'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">

          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" aria-label="Delete domain" onClick={() => setOpenDialog(true)} className="flex-shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Collapsible open={isOpen}>
        <CollapsibleContent>
          {!d.verified ? (
            <>
              <div className="mt-4">
                <div className="rounded-lg bg-white/4 dark:bg-black/4 border border-white/6 dark:border-white/8 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Required CNAME</div>
                      <div className="text-xs text-muted-foreground">Create a CNAME record so we can provision TLS for your hostname</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground text-right hidden sm:block">Host</div>
                      <div className="font-mono text-xs break-all sm:truncate">www <span className="text-xs text-muted-foreground">(or @)</span></div>
                      <Button variant="outline" size="sm" onClick={() => copy('www')} aria-label="Copy host" className="flex-shrink-0"><Icons.copy className="h-4 w-4" /></Button>
                      <div className="ml-4 text-xs text-muted-foreground text-right hidden sm:block">Target</div>
                      <div className="font-mono text-xs break-all sm:truncate max-w-[14rem]">cname.emberly.site</div>
                      <Button variant="outline" size="sm" onClick={() => copy('cname.emberly.site')} aria-label="Copy CNAME target" className="flex-shrink-0"><Icons.copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>

                {d.cfMeta && (
                  <div className="mt-3 rounded-lg bg-white/5 dark:bg-black/5 border border-white/8 dark:border-white/6 p-3">
                    <div className="text-sm font-medium mb-2">Verification records</div>
                    <div className="space-y-3 text-sm">
                      {(() => {
                        const renderRow = (label: string, name?: string, value?: string) => (
                          <div key={`${label}-${(name || '').slice(0, 40)}-${(value || '').slice(0, 40)}`} className="grid grid-cols-8gap-2 items-center">
                            <div className="col-span-12 sm:col-span-2 text-xs text-muted-foreground">{label}</div>
                            <div className="col-span-8 sm:col-span-5 flex items-center gap-2 min-w-0">
                              <div className="mr-2 text-xs text-muted-foreground hidden sm:block">Name</div>
                              <div className="font-mono text-xs break-all sm:truncate min-w-0">{name || ''}</div>
                              <Button variant="outline" size="sm" onClick={() => copy(name || '')} aria-label={`Copy ${label} name`} className="flex-shrink-0">
                                <Icons.copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="col-span-4 sm:col-span-5 flex items-center justify-end gap-2 min-w-0">
                              <div className="mr-2 text-xs text-muted-foreground hidden sm:block">Value</div>
                              <div className="font-mono text-xs break-all sm:truncate min-w-0 max-w-[18rem]">{value || ''}</div>
                              <Button variant="outline" size="sm" onClick={() => copy(value || '')} aria-label={`Copy ${label} value`} className="flex-shrink-0">
                                <Icons.copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )

                        const rows: JSX.Element[] = []
                        const ov = d.cfMeta?.ownership_verification || d.cfMeta?.ownership_verification_http
                        if (ov) rows.push(renderRow('Ownership', ov?.name || ov?.txt_name || ov?.txt_name, ov?.value || ov?.txt_value || ov?.http_body))
                        const vr = Array.isArray(d.cfMeta?.validation_records) && d.cfMeta.validation_records[0]
                        if (vr) rows.push(renderRow('Validation', vr.name || vr.txt_name, vr.value || vr.txt_value))
                        const svr = Array.isArray(d.cfMeta?.ssl?.validation_records) && d.cfMeta.ssl.validation_records[0]
                        if (svr) rows.push(renderRow('SSL', svr.txt_name || svr.name, svr.txt_value || svr.value))

                        return rows.length > 0 ? rows : (<div className="text-xs text-muted-foreground">No verification records available yet.</div>)
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">This domain is verified and ready to use.</div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Settings removed */}

      <Dialog open={openDialog} onOpenChange={(o) => !o && setOpenDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete domain</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">Are you sure you want to delete <strong>{d.domain}</strong>? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { setDeleting(true); await onDelete(d.id); setDeleting(false); setOpenDialog(false); }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
