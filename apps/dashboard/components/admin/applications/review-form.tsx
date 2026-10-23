'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface ApplicationReviewFormProps {
  applicationId: string
  currentStatus: string
  currentReviewNotes?: string | null
  applicationType?: string
  requestedStorageGB?: number
  requestedDomains?: number
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

/** Grants available to award on STAFF application approval */
const STAFF_GRANT_OPTIONS = [
  { value: 'SUPPORT', label: 'Support' },
  { value: 'DEVELOPER', label: 'Developer' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'DESIGNER', label: 'Designer' },
  { value: 'STAFF', label: 'Staff (general)' },
] as const

export function ApplicationReviewForm({
  applicationId,
  currentStatus,
  currentReviewNotes,
  applicationType,
  requestedStorageGB = 0,
  requestedDomains = 0,
}: ApplicationReviewFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<string>('')
  const [reviewNotes, setReviewNotes] = useState(currentReviewNotes ?? '')
  const [grantToAward, setGrantToAward] = useState<string>('')
  const [grantStorageGB, setGrantStorageGB] = useState(
    String(requestedStorageGB)
  )
  const [grantDomains, setGrantDomains] = useState(String(requestedDomains))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isFinal = currentStatus === 'APPROVED' || currentStatus === 'REJECTED'
  const isStaffApp = applicationType === 'STAFF'
  const showGrantPicker = isStaffApp && status === 'APPROVED'
  const showLimitInputs =
    applicationType === 'LIMIT_INCREASE' && status === 'APPROVED'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!status) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const body: Record<string, unknown> = {
        status,
        reviewNotes: reviewNotes.trim() || undefined,
      }
      if (status === 'APPROVED' && grantToAward) {
        body.grantToAward = grantToAward
      }
      if (showLimitInputs) {
        body.grantStorageGB = Number(grantStorageGB) || 0
        body.grantDomains = Number(grantDomains) || 0
      }

      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          <span>This application has been</span>
          <Badge
            variant="outline"
            className={DECISION_STYLES[currentStatus] ?? ''}
          >
            {currentStatus}
          </Badge>
          <span>and can no longer be modified.</span>
        </div>
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

      {showGrantPicker && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Grant to Award{' '}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <Select value={grantToAward} onValueChange={setGrantToAward}>
            <SelectTrigger>
              <SelectValue placeholder="Select a grant badge…" />
            </SelectTrigger>
            <SelectContent>
              {STAFF_GRANT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This badge will appear on the applicant&apos;s public profile.
          </p>
        </div>
      )}

      {showLimitInputs && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount to Grant</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Storage (GB)
              </span>
              <Input
                type="number"
                min={0}
                max={10000}
                value={grantStorageGB}
                onChange={(e) => setGrantStorageGB(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Domain slots
              </span>
              <Input
                type="number"
                min={0}
                max={100}
                value={grantDomains}
                onChange={(e) => setGrantDomains(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Prefilled with what the user asked for. Added on top of their
            current limits.
          </p>
        </div>
      )}

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
