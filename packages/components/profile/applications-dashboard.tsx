'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Briefcase,
  Handshake,
  BadgeCheck,
  Scale,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  FileText,
  ArrowRight,
  Undo2,
  ChevronDown,
  MessageSquare,
} from 'lucide-react'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/packages/components/ui/alert-dialog'
import { useToast } from '@/packages/hooks/use-toast'
import { ApplicationReplies } from '@/packages/components/applications/application-replies'

interface Application {
  id: string
  type: 'STAFF' | 'PARTNER' | 'VERIFICATION' | 'BAN_APPEAL'
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  answers: Record<string, unknown>
  reviewNotes?: string | null
  createdAt: string
  updatedAt: string
}

const TYPE_CONFIG = {
  STAFF: { label: 'Staff Application', icon: Briefcase, color: 'text-chart-1', bg: 'bg-chart-1/10', border: 'border-chart-1/30' },
  PARTNER: { label: 'Partnership', icon: Handshake, color: 'text-chart-3', bg: 'bg-chart-3/10', border: 'border-chart-3/30' },
  VERIFICATION: { label: 'Verification', icon: BadgeCheck, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  BAN_APPEAL: { label: 'Ban Appeal', icon: Scale, color: 'text-chart-5', bg: 'bg-chart-5/10', border: 'border-chart-5/30' },
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', icon: Clock, className: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  REVIEWING: { label: 'In Review', icon: AlertCircle, className: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  APPROVED: { label: 'Approved', icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  REJECTED: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30' },
  WITHDRAWN: { label: 'Withdrawn', icon: Undo2, className: 'bg-muted/50 text-muted-foreground border-border/50' },
}

export function ApplicationsDashboard() {
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawId, setWithdrawId] = useState<string | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/applications')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setApplications(data.data ?? data)
    } catch {
      toast({ title: 'Error', description: 'Failed to load applications', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleWithdraw = async () => {
    if (!withdrawId) return
    setWithdrawing(true)
    try {
      const res = await fetch(`/api/applications/${withdrawId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to withdraw')
      toast({ title: 'Withdrawn', description: 'Your application has been withdrawn.' })
      fetchApplications()
    } catch {
      toast({ title: 'Error', description: 'Failed to withdraw application', variant: 'destructive' })
    } finally {
      setWithdrawing(false)
      setWithdrawId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with link to submit new */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {applications.length === 0 ? 'You haven\'t submitted any applications yet.' : `${applications.length} application${applications.length !== 1 ? 's' : ''}`}
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/applications">
            New Application
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center text-center py-12 gap-4">
          <div className="p-4 rounded-full bg-muted/30">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium">No applications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Submit an application to join our team, become a partner, or request verification.
            </p>
          </div>
          <Button asChild>
            <Link href="/applications">
              Browse Applications
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const typeConf = TYPE_CONFIG[app.type]
            const statusConf = STATUS_CONFIG[app.status]
            const TypeIcon = typeConf.icon
            const StatusIcon = statusConf.icon
            const canWithdraw = app.status === 'PENDING' || app.status === 'REVIEWING'

            return (
              <div
                key={app.id}
                className="glass-subtle rounded-xl overflow-hidden"
              >
                <div
                  className="p-4 flex items-center gap-4 group cursor-pointer"
                  onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                >
                  <div className={`p-2.5 rounded-lg ${typeConf.bg} shrink-0`}>
                    <TypeIcon className={`h-5 w-5 ${typeConf.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{typeConf.label}</span>
                      <Badge variant="outline" className={`text-xs ${statusConf.className}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConf.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted {format(new Date(app.createdAt), 'MMM d, yyyy')}
                    </p>
                    {app.status === 'REJECTED' && app.reviewNotes && (
                      <p className="text-xs text-destructive/80 mt-1">
                        Feedback: {app.reviewNotes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canWithdraw && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          setWithdrawId(app.id)
                        }}
                      >
                        Withdraw
                      </Button>
                    )}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === app.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {expandedId === app.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-border/20">
                    <ApplicationReplies
                      applicationId={app.id}
                      disabled={app.status === 'WITHDRAWN'}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Withdraw confirmation */}
      <AlertDialog open={!!withdrawId} onOpenChange={(open) => !open && setWithdrawId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={withdrawing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw} disabled={withdrawing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {withdrawing ? 'Withdrawing...' : 'Withdraw'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
