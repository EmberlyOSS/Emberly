'use client'

import { useMemo, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'

export function ResetForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token') || ''
    const emailParam = searchParams.get('email') || ''

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const isMissingToken = useMemo(() => !token || !emailParam, [token, emailParam])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (isMissingToken) return
        if (password !== confirmPassword) {
            setError('Passwords must match')
            return
        }
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/auth/password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailParam, token, password }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => null)
                throw new Error(data?.error || 'Unable to reset password')
            }

            setSuccess(true)
            setTimeout(() => router.push('/auth/login'), 1200)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
                <p className="text-base text-muted-foreground">
                    {isMissingToken ? 'Invalid or missing reset link.' : 'Enter a new password for your account.'}
                </p>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium" htmlFor="password">
                        New password
                    </Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter a new password"
                        minLength={8}
                        required
                        disabled={isLoading || isMissingToken}
                        className="h-11 bg-background/50 focus:bg-background transition-colors"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                        placeholder="Re-enter your new password"
                        minLength={8}
                        required
                        disabled={isLoading || isMissingToken}
                        className="h-11 bg-background/50 focus:bg-background transition-colors"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                        <span>Password reset. Redirecting to sign in...</span>
                    </div>
                )}
            </div>
            <div className="pt-2">
                <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading || isMissingToken}>
                    {isLoading ? (
                        <>
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            Updating password...
                        </>
                    ) : (
                        'Update password'
                    )}
                </Button>
            </div>
        </form>
    )
}
