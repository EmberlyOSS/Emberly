'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { signIn } from 'next-auth/react'

import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { validatePasswordAction } from '@/packages/lib/security/password-actions'

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref') || searchParams.get('referral') || undefined
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const name = formData.get('name') as string

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Basic validation - just check it's not empty
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          ...(referralCode ? { referralCode } : {}),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to register')
      }

      const data = await res.json()

      // If email verification is required, redirect to verification page
      if (data.requiresVerification) {
        router.push('/auth/verify-email')
        return
      }

      // First user doesn't require verification, auto-sign in
      const result = await signIn('credentials', {
        emailOrUsername: email,
        password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error('Failed to sign in after registration')
      }

      router.push('/dashboard')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-2 text-center pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-base text-muted-foreground">
          Enter your details to get started
        </p>
        {referralCode && (
          <p className="text-sm text-primary font-medium">
            🎉 Invited by a friend — you&apos;ll both get credits when you join!
          </p>
        )}
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium" htmlFor="name">
            Username
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Create a username"
            required
            disabled={isLoading}
            className="h-11 bg-background/50 focus:bg-background transition-colors"
            autoComplete="name"
            autoFocus
          />
        </div>
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
            required
            disabled={isLoading}
            className="h-11 bg-background/50 focus:bg-background transition-colors"
            autoComplete="new-password"
            placeholder="Create a strong password"
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium" htmlFor="confirmPassword">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            disabled={isLoading}
            className="h-11 bg-background/50 focus:bg-background transition-colors"
            autoComplete="new-password"
            placeholder="Confirm your password"
            minLength={8}
          />
        </div>
        {error && (
          <div role="alert" aria-live="assertive" aria-atomic="true" className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center space-x-2">
            <Icons.alertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
      <div className="pt-6">
        <div className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full h-11 font-medium bg-primary hover:bg-primary/90 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
          <div className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary/90 hover:underline transition-colors font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </form>
  )
}
