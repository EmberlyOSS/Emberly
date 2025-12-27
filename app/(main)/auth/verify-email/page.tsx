'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/packages/components/ui/card'

export default function VerifyEmailPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('No verification token provided')
            return
        }

        const verifyEmail = async () => {
            try {
                const response = await fetch(`/api/auth/verify-email?token=${token}`)
                const data = await response.json()

                if (response.ok) {
                    setStatus('success')
                    setMessage(data.message || 'Email verified successfully!')
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        router.push('/auth/login?verified=true')
                    }, 3000)
                } else {
                    setStatus('error')
                    setMessage(data.error || 'Verification failed')
                }
            } catch {
                setStatus('error')
                setMessage('An error occurred during verification')
            }
        }

        verifyEmail()
    }, [token, router])

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        {status === 'loading' && (
                            <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                Verifying Email
                            </>
                        )}
                        {status === 'success' && (
                            <>
                                <CheckCircle className="h-6 w-6 text-green-500" />
                                Email Verified
                            </>
                        )}
                        {status === 'error' && (
                            <>
                                <XCircle className="h-6 w-6 text-red-500" />
                                Verification Failed
                            </>
                        )}
                    </CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {status === 'success' && (
                        <p className="text-sm text-muted-foreground text-center">
                            Redirecting to login page...
                        </p>
                    )}
                    {status === 'error' && (
                        <div className="flex flex-col gap-2">
                            <Button asChild>
                                <Link href="/auth/login">Go to Login</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/auth/register">Create New Account</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
