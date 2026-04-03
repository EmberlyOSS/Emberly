'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { Textarea } from '@/packages/components/ui/textarea'

interface ApplicationReviewFormProps {
  applicationId: string
  currentStatus: string
  currentReviewNotes?: string | null
}

const STATUS_OPTIONS = [
  { value: 'REVIEWING', label: 'Mark as Reviewing' },
  { value: 'APPROVED', label: 'Approve' },
  { value: 'REJECTED', label: 'Reject' },
] as const

const DECISION_STYLES: Record<string, string> = {
  REVIEWING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  APPROVED: 'bg-green-500/20 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export function ApplicationReviewForm({
  applicationId,
  currentStatus,
  currentReviewNotes,
}: ApplicationReviewFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<string>('')
  const [reviewNotes, setReviewNotes] = useState(currentReviewNotes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isFinal = currentStatus === 'APPROVED' || currentStatus === 'REJECTED'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!status) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewNotes: reviewNotes.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? 'Failed to update application')
        return
      }

      setSuccess(true)
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (isFinal) {
    return (
      <div className="rounded-xl border border-border/50 bg-background/80 backdrop-blur-lg p-4">
        <p className="text-sm text-muted-foreground">
          This application has been{' '}
          <Badge
            variant="outline"
            className={DECISION_STYLES[currentStatus] ?? ''}
          >
            {currentStatus}
          </Badge>{' '}
          and can no longer be modified.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Decision</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select a decision…" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Review Notes{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Textarea
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          placeholder="Internal notes or reason for decision…"
          rows={4}
          maxLength={5000}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {reviewNotes.length}/5000
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-400 bg-green-500/10 rounded-md px-3 py-2">
          Application updated successfully
        </p>
      )}

      <Button type="submit" disabled={!status || loading} className="w-full">
        {loading ? 'Saving…' : 'Submit Decision'}
      </Button>
    </form>
  )
}
