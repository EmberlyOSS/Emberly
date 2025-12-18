'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'

export function ForgotForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const res = await fetch('/api/auth/password/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => null)
                throw new Error(data?.error || 'Unable to send reset email')
            }

            setSuccess(true)
            setTimeout(() => router.refresh(), 500)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
                <p className="text-base text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                {error && (
                    <div role="alert" className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center space-x-2">
                        <Icons.alertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div role="status" className="text-sm text-green-600 bg-green-600/10 p-3 rounded-md flex items-center space-x-2">
                        <Icons.check className="h-4 w-4 flex-shrink-0" />
                        <span>If that email exists, a reset link is on its way.</span>
                    </div>
                )}
            </div>
            <div className="pt-2">
                <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            Sending reset link...
                        </>
                    ) : (
                        'Send reset link'
                    )}
                </Button>
            </div>
        </form>
    )
}
