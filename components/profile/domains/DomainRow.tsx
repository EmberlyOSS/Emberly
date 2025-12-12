import React, { useState } from 'react'
import { Check, Trash2, RefreshCw, Copy, Cloud } from 'lucide-react'
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
              <div className="font-medium">{d.domain}</div>
            </button>
          </div>
        </div>
        <div className="hidden md:flex md:items-center md:justify-end md:w-48 text-sm text-muted-foreground gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-xs truncate capitalize">
              {rechecking ?
                'Checking' :
                d.verified ?
                  'Verified' :
                  (d.cfStatus ?? 'Unverified')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:w-36 md:justify-end">
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
          <div className="pt-3 border-t border-white/6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">

              <div>
                <div className="text-sm font-semibold">Status</div>
                <div className="mt-2">
                  <div className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs bg-white/3">
                    {rechecking ? (
                      <>
                        <Icons.spinner className="h-3 w-3 animate-spin" />
                        <span>Checking</span>
                      </>
                    ) : d.verified ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-300" />
                        <span>Verified</span>
                      </>
                    ) : (
                      <>
                        <Icons.alertCircle className="h-3 w-3 text-rose-300" />
                        <span>{d.cfStatus ?? 'Unverified'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">DNS Records</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground text-left">
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Value</th>
                      <th className="py-2 pr-4">Proxied</th>
                      <th className="py-2 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Recommended CNAMEs (www and @) */}
                    {[{ name: '@ or www' }].map((c) => (
                      <tr key={c.name} className="border-t border-white/6">
                        <td className="py-2 pr-4 align-top">CNAME</td>
                        <td className="py-2 pr-4 align-top font-mono text-xs break-all">{c.name}</td>
                        <td className="py-2 pr-4 align-top font-mono text-xs break-all">cname.emberly.site</td>
                        <td className="py-2 pr-4 align-top">
                          <div className="inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs bg-emerald-700/10 text-emerald-200">
                            <Cloud className="h-3 w-3" />
                            <span>Proxied</span>
                          </div>
                        </td>
                        <td className="py-2 pr-4 text-right align-top">
                          <Button variant="ghost" size="icon" onClick={() => copy('cname.emberly.site')}><Copy className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}

                    {/* Ownership TXT */}
                    {d.cfMeta?.ownership_verification && (
                      <tr className="border-t border-white/6">
                        <td className="py-2 pr-4 align-top">TXT</td>
                        <td className="py-2 pr-4 align-top font-mono text-xs break-all">{d.cfMeta.ownership_verification?.txt_name || d.cfMeta.ownership_verification?.name || '@'}</td>
                        <td className="py-2 pr-4 align-top font-mono text-xs break-all">{d.cfMeta.ownership_verification?.txt_value || d.cfMeta.ownership_verification?.value || JSON.stringify(d.cfMeta.ownership_verification)}</td>
                        <td className="py-2 pr-4 align-top"></td>
                        <td className="py-2 pr-4 text-right align-top">
                          <Button variant="ghost" size="icon" onClick={() => copy(d.cfMeta.ownership_verification?.txt_value || d.cfMeta.ownership_verification?.value || JSON.stringify(d.cfMeta.ownership_verification))}><Copy className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    )}

                    {/* Validation records */}
                    {Array.isArray(d.cfMeta?.validation_records) && d.cfMeta.validation_records.map((r: any, i: number) => (
                      <tr key={i} className="border-t border-white/6">
                        <td className="py-2 pr-4 align-top">{(r.type || 'TXT').toUpperCase()}</td>
                        <td className="py-2 pr-4 align-top font-mono text-xs break-all">{r.txt_name || r.name || '@'}</td>
                        <td className="py-2 pr-4 align-top font-mono text-xs break-all">{r.txt_value || r.value || JSON.stringify(r)}</td>
                        <td className="py-2 pr-4 align-top"></td>
                        <td className="py-2 pr-4 text-right align-top">
                          <Button variant="ghost" size="icon" onClick={() => copy(r.txt_value || r.value || r.name || JSON.stringify(r))}><Copy className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!d.cfMeta && <div className="text-xs text-muted-foreground mt-2">No verification metadata yet.</div>}
              </div>
            </div>
          </div>
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
