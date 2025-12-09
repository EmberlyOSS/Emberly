import React, { useState } from 'react'
import { Check, Trash2, RefreshCw, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Icons } from '@/components/shared/icons'
import { writeToClipboard } from '@/lib/utils/clipboard'
import { Domain } from './types'

interface Props {
  d: Domain
  rechecking: boolean
  onSetPrimary: (id: string) => void
  onRecheck: (id: string) => void
  onDelete: (id: string) => Promise<void>
}

export default function DomainRow({ d, rechecking, onSetPrimary, onRecheck, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const copy = async (text: string) => {
    try {
      await writeToClipboard(text)
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="group py-3 px-3 hover:bg-white/3 dark:hover:bg-black/3 rounded-md">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen((s) => !s)} className="text-left min-w-0" title={open ? 'Collapse details' : 'Expand details'}>
              <div className="font-medium truncate">{d.domain}</div>
              <div className="text-xs text-muted-foreground truncate">{d.cfHostnameId ? `Cloudflare: ${d.cfHostnameId}` : 'Not yet provisioned'}</div>
            </button>
            <div className="flex items-center gap-2">
              {rechecking ? (
                <span className="inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs bg-blue-600/10 text-blue-400">
                  <Icons.spinner className="h-3 w-3 animate-spin" />
                  <span className="sr-only">Checking</span>
                  <span className="ml-0.5">Checking</span>
                </span>
              ) : d.verified ? (
                <span className="inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs bg-emerald-700/10 text-emerald-200">
                  <Check className="h-3 w-3" />
                  <span className="sr-only">Verified</span>
                  <span className="ml-0.5">Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs bg-rose-600/10 text-rose-300">
                  <Icons.alertCircle className="h-3 w-3" />
                  <span className="sr-only">Unverified</span>
                  <span className="ml-0.5">Unverified</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="hidden md:flex md:items-center md:justify-end md:w-80 text-sm text-muted-foreground gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="font-mono text-xs truncate">www</div>
            <div className="font-mono text-xs truncate max-w-[12rem]">cname.emberly.site</div>
            <Button variant="ghost" size="icon" title="Copy CNAME target" onClick={() => copy('cname.emberly.site')} className="flex-shrink-0"><Copy className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="Re-check Cloudflare" onClick={() => onRecheck(d.id)} className="flex-shrink-0"> <RefreshCw className="h-4 w-4" /> </Button>
          {/* settings removed — config modal deprecated */}
          <Button variant="destructive" size="icon" title="Delete domain" onClick={() => setDeleting(true)} className="flex-shrink-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Inline expandable details */}
      {open && (
        <div className="mt-3 pl-1 text-sm text-muted-foreground">
          {!d.verified ? (
            <div className="pt-3 border-t border-white/6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Required CNAME</div>
                  <div className="text-xs">Create a CNAME record so we can provision TLS for your hostname</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-xs">www</div>
                  <div className="font-mono text-xs">cname.emberly.site</div>
                </div>
              </div>

              {d.cfMeta ? (
                <div className="mt-3">
                  <div className="text-sm font-medium mb-2">Verification records</div>
                  <div className="space-y-2 text-sm">
                    {d.cfMeta?.ownership_verification && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-xs text-muted-foreground">Ownership</div>
                        <div className="font-mono text-xs break-all">{d.cfMeta.ownership_verification?.txt_name || d.cfMeta.ownership_verification?.name}</div>
                        <Button variant="outline" size="sm" onClick={() => copy(JSON.stringify(d.cfMeta.ownership_verification))}><Copy className="h-4 w-4" /></Button>
                      </div>
                    )}
                    {Array.isArray(d.cfMeta?.validation_records) && d.cfMeta.validation_records.map((r: any, i: number) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-xs text-muted-foreground">Validation</div>
                        <div className="font-mono text-xs break-all">{r.txt_name || r.name}</div>
                        <Button variant="outline" size="sm" onClick={() => copy(JSON.stringify(r))}><Copy className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-2">No verification metadata yet.</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">This domain is verified and ready to use.</div>
          )}
        </div>
      )}

      {/* Settings removed */}

      {/* Delete confirmation dialog */}
      <Dialog open={deleting} onOpenChange={(o) => !o && setDeleting(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete domain</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">Are you sure you want to delete <strong>{d.domain}</strong>? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { await onDelete(d.id); setDeleting(false); }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
