'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'

export function MagicLinkCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    const [status, setStatus] = useState<'validating' | 'signing-in' | 'success' | 'error'>('validating')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!token || !email) {
            setStatus('error')
            setError('Invalid magic link parameters')
            return
        }

        const verify = async () => {
            try {
                // Verify the magic link token
                const verifyRes = await fetch('/api/auth/magic-link/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, email }),
                })

                if (!verifyRes.ok) {
                    const data = await verifyRes.json().catch(() => ({}))
                    throw new Error(data.error || 'Invalid or expired magic link')
                }

                setStatus('signing-in')

                // Sign in the user with the credentials provider
                const signInResult = await signIn('credentials', {
                    email,
                    magicLink: true,
                    redirect: false,
                    callbackUrl: '/dashboard',
                })

                if (signInResult?.error) {
                    throw new Error(signInResult.error || 'Failed to sign in')
                }

                setStatus('success')
                setTimeout(() => {
                    router.push(signInResult?.url || '/dashboard')
                }, 1000)
            } catch (err) {
                console.error('Magic link error:', err)
                setStatus('error')
                setError(err instanceof Error ? err.message : 'Failed to verify magic link')
            }
        }

        verify()
    }, [token, email, router])

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6 text-center">
                {status === 'validating' && (
                    <>
                        <div className="flex justify-center">
                            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">Verifying your link...</h1>
                            <p className="text-sm text-muted-foreground mt-2">
                                Hold tight, we&apos;re confirming your magic link.
                            </p>
                        </div>
                    </>
                )}

                {status === 'signing-in' && (
                    <>
                        <div className="flex justify-center">
                            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">Signing you in...</h1>
                            <p className="text-sm text-muted-foreground mt-2">
                                You&apos;ll be redirected to your dashboard shortly.
                            </p>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="flex justify-center">
                            <Icons.check className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-green-600">Success!</h1>
                            <p className="text-sm text-muted-foreground mt-2">
                                You&apos;re being redirected to your dashboard.
                            </p>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="flex justify-center">
                            <Icons.alertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-destructive">Link Invalid</h1>
                            <p className="text-sm text-muted-foreground mt-2">
                                {error || 'Your magic link is invalid or has expired.'}
                            </p>
                            <Button asChild className="mt-6 w-full">
                                <a href="/auth/login">Back to Login</a>
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
