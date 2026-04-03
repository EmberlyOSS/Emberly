'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error' | 'expired'

interface VerifyEmailFormProps {
  token?: string
}

export function VerifyEmailForm({ token }: VerifyEmailFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<VerificationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [manualToken, setManualToken] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Auto-verify if token is provided in URL
  useEffect(() => {
    if (token && status === 'idle') {
      verifyToken(token)
    }
  }, [token, status])

  async function verifyToken(verificationToken: string) {
    setIsVerifying(true)
    setStatus('verifying')
    setError(null)

    try {
      const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`)
      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else if (data.error && data.error.toLowerCase().includes('expired')) {
        setStatus('expired')
        setError('Verification code expired. Please request a new one.')
      } else {
        setStatus('error')
        setError(data.error || 'Verification failed. Please check your token and try again.')
      }
    } catch (err) {
      setStatus('error')
      setError('An error occurred during verification. Please try again.')
      console.error('Verification error:', err)
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleManualSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!manualToken.trim()) {
      setError('Please enter your verification code')
      return
    }
    await verifyToken(manualToken)
  }

  async function handleLogout() {
    await signOut({ redirect: true, callbackUrl: '/auth/login' })
  }

  async function handleBackToLogin() {
    await handleLogout()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Verify your email
        </h1>
        <p className="text-base text-muted-foreground">
          We sent a verification link to your email. Click it to verify, or enter the 6-digit code below.
        </p>
      </div>

      {/* Loading State */}
      {status === 'verifying' && (
        <div className="space-y-4 py-6">
          <div className="flex justify-center">
            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Verifying your email...
          </p>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && (
        <div className="space-y-4 py-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/10 p-3">
              <Icons.check className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <p className="font-medium text-green-500">Email verified!</p>
            <p className="text-sm text-muted-foreground">
              You can now access your dashboard.
            </p>
            <p className="text-xs text-muted-foreground">
              Redirecting in a moment...
            </p>
          </div>
        </div>
      )}

      {/* Error or Manual Input State */}
      {(status === 'error' || status === 'expired' || status === 'idle') && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="token">
              Verification Code
            </Label>
            <Input
              id="token"
              name="token"
              type="text"
              placeholder="Enter 6-digit code"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              disabled={isVerifying}
              maxLength={6}
              className="h-14 font-mono text-2xl bg-background/50 focus:bg-background transition-colors text-center tracking-[0.5em]"
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-digit code from your email
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
            disabled={isVerifying || !manualToken.trim()}
          >
            {isVerifying ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </Button>
        </form>
      )}

      {/* Footer Links */}
      <div className="flex flex-col space-y-3 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          {status === 'success' ? (
            'You will be redirected shortly'
          ) : (
            <>
              Didn't receive the email?{' '}
              <Link
                href="/auth/resend-verification"
                className="text-primary hover:text-primary/90 hover:underline transition-colors font-medium"
              >
                Request a new code
              </Link>
            </>
          )}
        </p>
        {status !== 'success' && (
          <div className="text-xs text-amber-600/70 dark:text-amber-500/70 bg-amber-500/10 p-2 rounded">
            You must verify your email to continue. If you need to log out, use the button below.
          </div>
        )}
        {status !== 'success' && (
          <Button
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors h-auto py-2"
            onClick={handleBackToLogin}
          >
            Log out
          </Button>
        )}
      </div>
    </div>
  )
}
