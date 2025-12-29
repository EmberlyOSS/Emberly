'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'

interface TwoFactorFormProps {
  email: string
  password: string
  onCancel: () => void
}

export function TwoFactorForm({
  email,
  password,
  onCancel,
}: TwoFactorFormProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code')
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        twoFactorCode: code,
        redirect: false,
        callbackUrl: '/dashboard',
      })

      if (result?.error) {
        setError('Invalid authentication code. Please try again.')
        setCode('')
        return
      }

      if (result?.ok) {
        router.push((result?.url as string) || '/dashboard')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit}>
        <div className="space-y-2 text-center pb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Two Factor Authentication</h1>
          <p className="text-base text-muted-foreground">
            Please enter the 6 digit code provided by your configured authenticator app.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="2fa-code">
              Authentication Code
            </Label>
            <Input
              id="2fa-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              placeholder="000000"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(val)
              }}
              disabled={isLoading}
              className="h-11 bg-background/50 focus:bg-background transition-colors text-center text-2xl tracking-widest font-mono"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground">
              If you lost access to your device or authenticator app,
              please contact our support team for assistance.
            </p>
          </div>

          {error && (
            <div role="alert" aria-live="assertive" aria-atomic="true" className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center space-x-2">
              <Icons.alertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="pt-4 space-y-2">
          <Button
            type="submit"
            className="w-full h-11 font-medium bg-primary hover:bg-primary/90 transition-colors"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={onCancel}
            disabled={isLoading}
          >
            Back to login
          </Button>
        </div>
      </form>
    </div>
  )
}
