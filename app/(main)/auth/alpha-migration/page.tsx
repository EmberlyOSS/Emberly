'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Gift, Globe, Loader2, Mail, Send, Sparkles, Shield } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/packages/components/ui/card'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Alert, AlertDescription } from '@/packages/components/ui/alert'
import { Badge } from '@/packages/components/ui/badge'
import { DynamicBackground } from '@/packages/components/layout/dynamic-background'

export default function AlphaMigrationPage() {
    const { data: session, status, update } = useSession()
    const router = useRouter()

    const [step, setStep] = useState<'confirm' | 'verify' | 'complete'>('confirm')
    const [email, setEmail] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [codeSent, setCodeSent] = useState(false)

    useEffect(() => {
        if (status === 'loading') return

        // Not logged in - redirect to login
        if (!session?.user) {
            router.push('/auth/login')
            return
        }

        // Set current email
        setEmail(session.user.email || '')
    }, [session, status, router])

    const handleSendVerification = async () => {
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/api/auth/alpha-migration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, action: 'send-verification' }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Failed to send verification email')
                return
            }

            setSuccess('Verification code sent! Check your email.')
            setCodeSent(true)
            setStep('verify')
        } catch {
            setError('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyCode = async () => {
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/api/auth/alpha-migration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: verificationCode, action: 'verify' }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Verification failed')
                return
            }

            setSuccess('Email verified successfully!')
            setStep('complete')

            // Refresh the session to update needsAlphaMigration flag
            await update()

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)
        } catch {
            setError('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendCode = async () => {
        setIsLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/alpha-migration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, action: 'send-verification' }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Failed to resend code')
                return
            }

            setSuccess('New verification code sent!')
        } catch {
            setError('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <DynamicBackground />
            <div className="w-full max-w-xl space-y-6">
                {/* Hero Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        <Sparkles className="h-4 w-4" />
                        Alpha Supporter
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {step === 'complete' ? 'Welcome Back!' : 'One Quick Step'}
                    </h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        {step === 'complete'
                            ? 'Your account has been upgraded with your alpha supporter benefits.'
                            : 'Thank you for being an early supporter of Emberly. We just need to verify your email to unlock your account.'}
                    </p>
                </div>

                {/* Alpha Reward Card */}
                {step !== 'complete' && (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-primary/10">
                                    <Gift className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">Alpha Supporter Reward</h3>
                                        <Badge variant="secondary" className="text-xs">Free</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        As a thank you for being an early adopter, you&apos;ll receive <strong className="text-foreground">+1 bonus custom domain slot</strong> completely free when you verify your email.
                                    </p>
                                    <div className="flex items-center gap-4 pt-1 text-sm">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Globe className="h-4 w-4 text-primary" />
                                            <span>Custom domain</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Shield className="h-4 w-4 text-primary" />
                                            <span>Secured account</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Card */}
                <Card className="shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-3">
                            {step === 'complete' ? (
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            ) : (
                                <Mail className="h-8 w-8 text-primary" />
                            )}
                        </div>
                        <CardTitle className="text-xl">
                            {step === 'complete' ? 'Migration Complete!' : 'Verify Your Email'}
                        </CardTitle>
                        <CardDescription>
                            {step === 'complete'
                                ? 'Your bonus domain slot has been added to your account.'
                                : 'Verify your email to secure your account and claim your reward.'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5 pt-2">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && step !== 'complete' && (
                            <Alert className="border-green-500/30 bg-green-500/10">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-green-700 dark:text-green-400">{success}</AlertDescription>
                            </Alert>
                        )}

                        {step === 'confirm' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="h-11"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        We&apos;ll send a 6 digit verification code to this address.
                                    </p>
                                </div>

                                <Button
                                    onClick={handleSendVerification}
                                    disabled={isLoading || !email}
                                    className="w-full h-11"
                                    size="lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Verification Code
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {step === 'verify' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Verification Code</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="h-11 text-center text-2xl tracking-[0.5em] font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground text-center">
                                        Enter the code sent to <strong>{email}</strong>
                                    </p>
                                </div>

                                <Button
                                    onClick={handleVerifyCode}
                                    disabled={isLoading || verificationCode.length < 6}
                                    className="w-full h-11"
                                    size="lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Verify & Claim Reward
                                        </>
                                    )}
                                </Button>

                                <div className="flex items-center justify-between pt-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setStep('confirm')
                                            setCodeSent(false)
                                            setVerificationCode('')
                                        }}
                                        disabled={isLoading}
                                        className="text-muted-foreground"
                                    >
                                        Change email
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResendCode}
                                        disabled={isLoading}
                                        className="text-muted-foreground"
                                    >
                                        Resend code
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 'complete' && (
                            <div className="text-center space-y-5">
                                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-medium">
                                        <Gift className="h-5 w-5" />
                                        <span>+1 Custom Domain Slot Added</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Redirecting to dashboard...</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Note */}
                {step !== 'complete' && (
                    <p className="text-center text-xs text-muted-foreground">
                        During our alpha stages, we didn&apos;t have email verification. This one time step ensures
                        your account is secure and enables password recovery.
                    </p>
                )}
            </div>
        </div>
    )
}
