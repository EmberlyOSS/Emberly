'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { signIn } from 'next-auth/react'

import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'

interface LoginFormProps {
  registrationsEnabled: boolean
  disabledMessage: string
}

export function LoginForm({
  registrationsEnabled,
  disabledMessage,
}: LoginFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [magicEmail, setMagicEmail] = useState('')

  async function onPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      })

      if (result?.error) {
        setError('Invalid email or password')
        return
      }

      router.push((result?.url as string) || '/dashboard')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function onMagicLinkSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('magic-email') as string

    try {
      const response = await fetch('/api/auth/magic-link/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send magic link')
      }

      setMagicLinkSent(true)
      setMagicEmail(email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Tabs defaultValue="password" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
      </TabsList>

      <TabsContent value="password" className="space-y-4">
        <form onSubmit={onPasswordSubmit}>
          <div className="space-y-2 text-center pb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-base text-muted-foreground">
              {registrationsEnabled ? (
                <>
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/auth/register"
                    className="text-primary hover:text-primary/90 hover:underline transition-colors font-medium"
                  >
                    Sign up now
                  </Link>
                </>
              ) : (
                disabledMessage || 'Registrations are currently disabled'
              )}
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium" htmlFor="email">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                disabled={isLoading}
                className="h-11 bg-background/50 focus:bg-background transition-colors"
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium" htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="h-11 bg-background/50 focus:bg-background transition-colors"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div role="alert" aria-live="assertive" aria-atomic="true" className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center space-x-2">
                <Icons.alertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <div className="pt-2 flex items-center justify-between text-sm text-primary">
            <Link href="/auth/forgot" className="hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full h-11 font-medium bg-primary hover:bg-primary/90 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="magic-link" className="space-y-4">
        <form onSubmit={onMagicLinkSubmit}>
          <div className="space-y-2 text-center pb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in with Magic Link</h1>
            <p className="text-base text-muted-foreground">
              Get a sign in link sent to your email
            </p>
          </div>

          {magicLinkSent ? (
            <div className="space-y-4">
              <div role="status" className="text-sm text-green-600 bg-green-600/10 p-4 rounded-md flex items-start space-x-3">
                <Icons.check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Check your email</p>
                  <p className="text-xs text-green-600/80 mt-1">
                    We sent a sign in link to <strong>{magicEmail}</strong>
                  </p>
                  <p className="text-xs text-green-600/80 mt-1">
                    The link expires in 15 minutes.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={() => {
                  setMagicLinkSent(false)
                  setError(null)
                }}
              >
                Send another link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium" htmlFor="magic-email">
                  Email address
                </Label>
                <Input
                  id="magic-email"
                  name="magic-email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                  className="h-11 bg-background/50 focus:bg-background transition-colors"
                  autoComplete="email"
                  autoFocus
                />
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send sign in link'
                )}
              </Button>

              {registrationsEnabled && (
                <p className="text-sm text-muted-foreground text-center">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/auth/register"
                    className="text-primary hover:text-primary/90 hover:underline transition-colors font-medium"
                  >
                    Sign up now
                  </Link>
                </p>
              )}
            </div>
          )}
        </form>
      </TabsContent>
    </Tabs>
  )
}
