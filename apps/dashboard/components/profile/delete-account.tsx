'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useToast } from '@/hooks/use-toast'

export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const deleteAccount = async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || "Couldn't delete your account")
      }
      toast({ title: 'Your account was deleted' })
      router.push('/auth/login')
    } catch (error) {
      toast({
        title: 'Account not deleted',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-destructive">Delete account</h3>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account, files, links and settings. This
            can&apos;t be undone, so export your data first if you want a copy.
          </p>
        </div>
        {!confirming && (
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirming(true)}
          >
            Delete account
          </Button>
        )}
      </div>
      {confirming && (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            if (password && !busy) deleteAccount()
          }}
        >
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password to confirm"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="sm:max-w-xs"
          />
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setConfirming(false)
              setPassword('')
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={!password || busy}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete permanently
          </Button>
        </form>
      )}
    </div>
  )
}
