'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'

type ResendStatus = 'idle' | 'loading' | 'success' | 'error'

export function ResendVerificationForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<ResendStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setStatus('loading')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setError(data.error || 'Failed to resend verification email')
        setIsLoading(false)
        return
      }

      setStatus('success')
      setEmail('')
      
      // Redirect to verify-email page after 2 seconds
      setTimeout(() => {
        router.push('/auth/verify-email')
      }, 2000)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Resend verification email
        </h1>
        <p className="text-base text-muted-foreground">
          Enter your email address and we'll send you a new verification code
        </p>
      </div>

      {/* Success State */}
      {status === 'success' && (
        <div className="space-y-4 py-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/10 p-3">
              <Icons.check className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <p className="font-medium text-green-500">Email sent!</p>
            <p className="text-sm text-muted-foreground">
              We've sent a new verification code to your email address.
            </p>
            <p className="text-xs text-muted-foreground">
              Redirecting to verify email page...
            </p>
          </div>
        </div>
      )}

      {/* Form State */}
      {status !== 'success' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="email">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="h-11 bg-background/50 focus:bg-background transition-colors"
              autoComplete="email"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              We'll send a new verification code to this email address
            </p>
          </div>

          {error && (
            <div role="alert" aria-live="assertive" aria-atomic="true" className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center space-x-2">
              <Icons.alertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 font-medium bg-primary hover:bg-primary/90 transition-colors"
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Verification Code'
            )}
          </Button>
        </form>
      )}

      {/* Footer Links */}
      <div className="flex flex-col space-y-3 pt-4 border-t border-white/10">
        <Link
          href="/auth/verify-email"
          className="text-xs text-muted-foreground hover:text-foreground text-center hover:underline transition-colors"
        >
          I already have a code
        </Link>
        <Link
          href="/auth/login"
          className="text-xs text-muted-foreground hover:text-foreground text-center hover:underline transition-colors"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
