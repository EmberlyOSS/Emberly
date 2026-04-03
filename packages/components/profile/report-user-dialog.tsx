'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { Button } from '@/packages/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/packages/components/ui/dialog'
import { Label } from '@/packages/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { Textarea } from '@/packages/components/ui/textarea'
import { useToast } from '@/packages/hooks/use-toast'

const CATEGORY_LABELS: Record<string, string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment',
  INAPPROPRIATE_CONTENT: 'Inappropriate Content',
  IMPERSONATION: 'Impersonation',
  ABUSE: 'Abuse',
  OTHER: 'Other',
}

interface ReportUserDialogProps {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportUserDialog({ userId, userName, open, onOpenChange }: ReportUserDialogProps) {
  const { toast } = useToast()
  const [category, setCategory] = useState('')
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setCategory('')
    setReason('')
    setDetails('')
    setError(null)
  }

  function handleOpenChange(value: boolean) {
    if (!value) resetForm()
    onOpenChange(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!category) {
      setError('Please select a category.')
      return
    }
    if (reason.length < 10) {
      setError('Reason must be at least 10 characters.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUserId: userId,
          category,
          reason,
          details: details || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? 'Failed to submit report. Please try again.')
        return
      }

      toast({
        title: 'Report submitted',
        description: 'Our team will review it.',
      })
      handleOpenChange(false)
    } catch {
      setError('Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-destructive" />
            Report {userName}
          </DialogTitle>
          <DialogDescription>
            Help keep the community safe. Reports are reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="report-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="report-category">
                <SelectValue placeholder="Select a reason…" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-reason">
              Reason <span className="text-muted-foreground text-xs">(required, 10–500 chars)</span>
            </Label>
            <Textarea
              id="report-reason"
              placeholder="Describe why you are reporting this user…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground text-right">{reason.length}/500</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details">
              Additional details <span className="text-muted-foreground text-xs">(optional, max 2000 chars)</span>
            </Label>
            <Textarea
              id="report-details"
              placeholder="Any extra context that may help our team…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
