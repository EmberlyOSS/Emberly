'use client'

import { useEffect, useState } from 'react'
import { Edit2, Plus, Trash2, Users } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { EmptyState, Panel, StatusBadge } from '@/components/layout/page-kit'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import PartnerForm from './partner-form'

function PartnerTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">
              Name
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">
              Tagline
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">
              Status
            </TableHead>
            <TableHead className="text-right text-muted-foreground font-medium">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i} className="border-border/50">
              <TableCell>
                <Skeleton className="h-4 w-[180px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[220px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function PartnerList() {
  const { toast } = useToast()
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [open, setOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/partners?all=true')
      const payload = await res.json()
      if (res.ok) {
        // API responses are wrapped as { data, success }
        const value = Array.isArray(payload) ? payload : payload?.data
        setPartners(Array.isArray(value) ? value : [])
      }
    } catch (err) {
      console.error(err)
      toast({
        title: 'Error',
        description: 'Failed to load partners',
        variant: 'destructive',
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function onSaved(p: any) {
    setOpen(false)
    load()
  }

  async function handleDelete(id: string, name: string) {
    toast({
      title: `Delete "${name}"?`,
      description: 'This cannot be undone.',
      variant: 'destructive',
      action: (
        <ToastAction
          altText="Confirm delete"
          onClick={async () => {
            try {
              const res = await fetch(`/api/partners/${id}`, {
                method: 'DELETE',
              })
              if (res.ok) {
                toast({
                  title: 'Partner deleted',
                  description: `Successfully deleted ${name}`,
                })
                load()
              } else {
                toast({
                  title: 'Error',
                  description: 'Failed to delete partner',
                  variant: 'destructive',
                })
              }
            } catch (err) {
              toast({
                title: 'Error',
                description: 'Request failed',
                variant: 'destructive',
              })
            }
          }}
        >
          Delete
        </ToastAction>
      ),
    })
  }

  const startNew = () => {
    setEditing(null)
    setOpen(true)
  }

  return (
    <>
      {open && (
        <Panel title={editing ? `Edit ${editing.name}` : 'New partner'}>
          <PartnerForm
            partner={editing}
            onSaved={onSaved}
            onCancel={() => setOpen(false)}
          />
        </Panel>
      )}

      <Panel
        flush
        title="Partners"
        description="Shown on the homepage and partners page."
        actions={
          !open && (
            <Button size="sm" onClick={startNew}>
              <Plus className="mr-1.5 h-4 w-4" />
              New partner
            </Button>
          )
        }
      >
        {loading ? (
          <PartnerTableSkeleton />
        ) : partners.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No partners yet"
            description="Add partners to show them on your homepage."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="pl-5">Name</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Tagline
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((p) => (
                  <TableRow key={p.id} className="border-border/50">
                    <TableCell className="pl-5 font-medium">{p.name}</TableCell>
                    <TableCell className="hidden max-w-[24rem] truncate text-muted-foreground md:table-cell">
                      {p.tagline || '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={p.active ? 'success' : 'neutral'}>
                        {p.active ? 'Active' : 'Hidden'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(p)
                            setOpen(true)
                          }}
                          className="h-8 w-8"
                          aria-label={`Edit ${p.name}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(p.id, p.name)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </>
  )
}

export default PartnerList
