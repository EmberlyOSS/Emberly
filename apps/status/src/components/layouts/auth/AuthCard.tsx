'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormInput, FormLabel } from '@/components/ui/form';
import type { AuthFAQItem } from './AuthFAQ';
import AuthFAQ from './AuthFAQ';
import { BrandLogo } from '@/components/ui/BrandLogo';

type Props = {
    title?: string;
    subtitle?: string;
    mode?: 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';
    faqs?: AuthFAQItem[];
};

export default function AuthCard({ title, subtitle, mode = 'signin', faqs }: Props) {
    // Sign in
    const [siEmail, setSiEmail] = useState('');
    const [siPassword, setSiPassword] = useState('');
    const [siError, setSiError] = useState('');
    const [siLoading, setSiLoading] = useState(false);

    // Sign up
    const [suEmail, setSuEmail] = useState('');
    const [suName, setSuName] = useState('');
    const [suUsername, setSuUsername] = useState('');
    const [suPassword, setSuPassword] = useState('');
    const [suError, setSuError] = useState('');
    const [suSuccess, setSuSuccess] = useState('');
    const [suLoading, setSuLoading] = useState(false);
    const [pwBreachCount, setPwBreachCount] = useState<number | null>(null);
    const [pwBreachLoading, setPwBreachLoading] = useState(false);

    const passwordStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(suPassword);
    const passwordStrengthMsg = suPassword.length === 0 ? '' : passwordStrong ? 'Strong password.' : 'Minimum 8 characters with uppercase, lowercase, number and symbol.';
    const passwordBreachMsg = pwBreachCount === null ? '' : pwBreachCount === 0 ? 'Not found in known breaches.' : `Found in ${pwBreachCount} known breach${pwBreachCount > 1 ? 'es' : ''}. Choose a different password.`;

    async function sha1(str: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    useEffect(() => {
        if (!passwordStrong || suPassword.length === 0) {
            setPwBreachCount(null);
            setPwBreachLoading(false);
            return;
        }
        setPwBreachLoading(true);
        const timer = setTimeout(async () => {
            try {
                const hash = await sha1(suPassword);
                const prefix = hash.slice(0, 5);
                const suffix = hash.slice(5);
                const resp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
                const text = await resp.text();
                let found = 0;
                for (const line of text.split('\n')) {
                    const [hashSuffix, count] = line.trim().split(':');
                    if (hashSuffix && hashSuffix.toUpperCase() === suffix) {
                        found = parseInt(count, 10);
                        break;
                    }
                }
                setPwBreachCount(found);
            } catch {
                setPwBreachCount(null);
            } finally {
                setPwBreachLoading(false);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [suPassword, passwordStrong]);

    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams?.get('email') || '';
    const token = searchParams?.get('token') || '';
    const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
    const [verifyLoading, setVerifyLoading] = useState(false);

    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotStatus, setForgotStatus] = useState<string | null>(null);
    const [forgotLoading, setForgotLoading] = useState(false);

    const [resetPassword, setResetPassword] = useState('');
    const [resetStatus, setResetStatus] = useState<string | null>(null);
    const [resetLoading, setResetLoading] = useState(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setSiError('');
        setSiLoading(true);
        const res = await signIn('credentials', { redirect: false, email: siEmail, password: siPassword });
        if (res?.error) setSiError(res.error as string);
        if (res?.ok) window.location.href = '/';
        setSiLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuError('');
        setSuSuccess('');
        const normalized = suUsername.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
            setSuError('Username must be 3-30 characters: lowercase letters, numbers, or underscores.');
            return;
        }
        setSuLoading(true);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: suEmail, password: suPassword, name: suName, username: normalized }),
            });
            let data: any = null;
            const text = await res.text();
            try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
            if (!res.ok) {
                setSuError(data?.error ?? data?.message ?? res.statusText ?? `Request failed (${res.status})`);
            } else {
                setSuSuccess('Account created! Please check your email to verify your account.');
            }
        } catch (err) {
            setSuError((err as any)?.message ?? 'Sign up failed. Please check your connection.');
        } finally {
            setSuLoading(false);
        }
    };

    const handleVerify = async () => {
        setVerifyLoading(true);
        setVerifyStatus(null);
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token }),
            });
            const data = await res.json();
            if (data.success) {
                setVerifyStatus('success');
                setTimeout(() => router.push('/auth/signin'), 2000);
            } else {
                setVerifyStatus(data.error || 'Verification failed.');
            }
        } catch {
            setVerifyStatus('An error occurred. Please try again later.');
        }
        setVerifyLoading(false);
    };

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotStatus(null);
        setForgotLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            });
            const data = await res.json();
            if (data.success) {
                setForgotStatus('success');
            } else {
                setForgotStatus(data.error || 'Failed to send reset email.');
            }
        } catch {
            setForgotStatus('An error occurred. Please try again later.');
        }
        setForgotLoading(false);
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetStatus(null);
        setResetLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, password: resetPassword }),
            });
            const data = await res.json();
            if (data.success) {
                setResetStatus('success');
                setTimeout(() => router.push('/auth/signin'), 2000);
            } else {
                setResetStatus(data.error || 'Failed to reset password.');
            }
        } catch {
            setResetStatus('An error occurred. Please try again later.');
        }
        setResetLoading(false);
    };

    const defaultTitle = mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : mode === 'verify' ? 'Verify your email' : mode === 'forgot' ? 'Reset your password' : 'Choose a new password';
    const defaultSubtitle = mode === 'signin' ? 'Sign in to manage your status alerts.' : mode === 'signup' ? 'Get notified when Emberly has an incident or scheduled maintenance.' : mode === 'verify' ? 'Confirm your email address to activate your account.' : mode === 'forgot' ? 'Enter your email and we’ll send you a reset link.' : 'Enter your new password below.';

    const inputClass = 'bg-[#0f0c0b]/80 border border-white/[0.1] text-white placeholder:text-[#57534e] focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 rounded-lg transition-colors';
    const statusGood = 'p-3 text-sm rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300';
    const statusWarn = 'p-3 text-sm rounded-lg border border-red-900/40 bg-red-950/20 text-red-400';

    return (
        <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-12 sm:py-16">
            <div className="w-full max-w-sm">
                {/* Header */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="relative mb-5">
                        <div className="absolute inset-0 rounded-2xl bg-orange-500/30 blur-xl" aria-hidden="true" />
                        <div className="glass-card relative flex h-14 w-14 items-center justify-center">
                            <BrandLogo size={30} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title ?? defaultTitle}</h1>
                    <p className="mt-2 text-sm text-[#a8a29e] text-balance">{subtitle ?? defaultSubtitle}</p>
                </div>

                {/* Card */}
                <div className="glass-card p-6 sm:p-7">
                    {mode === 'signin' && (
                        <Form onSubmit={handleSignIn} autoComplete="off" className="space-y-4">
                            <FormField name="email">
                                <FormLabel className="text-sm font-medium text-[#d6d3d1]">Email</FormLabel>
                                <FormControl asChild>
                                    <FormInput type="email" autoComplete="off" placeholder="you@example.com" value={siEmail} onChange={(e) => setSiEmail(e.target.value)} required className={inputClass} />
                                </FormControl>
                            </FormField>
                            <FormField name="password">
                                <FormLabel className="text-sm font-medium text-[#d6d3d1]">Password</FormLabel>
                                <FormControl asChild>
                                    <FormInput type="password" autoComplete="off" placeholder="Password" value={siPassword} onChange={(e) => setSiPassword(e.target.value)} required className={inputClass} />
                                </FormControl>
                            </FormField>
                            {siError && <div className={statusWarn}>{siError}</div>}
                            <Button type="submit" className="w-full" disabled={siLoading}>
                                {siLoading ? 'Signing in...' : 'Sign in'}
                            </Button>
                            <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
                                <a href="/auth/signup" className="text-[#a8a29e] hover:text-white transition-colors">Create account</a>
                                <a href="/auth/forgot-password" className="text-[#78716c] hover:text-[#a8a29e] transition-colors">Forgot password?</a>
                            </div>
                        </Form>
                    )}

                    {mode === 'signup' && (
                        <Form onSubmit={handleSignUp} autoComplete="off" className="space-y-4">
                            <FormField name="name">
                                <FormLabel className="text-sm font-medium text-[#d6d3d1]">Name</FormLabel>
                                <FormControl asChild>
                                    <FormInput type="text" autoComplete="off" placeholder="Your name" value={suName} onChange={(e) => setSuName(e.target.value)} required className={inputClass} />
                                </FormControl>
                            </FormField>
                            <FormField name="username">
                                <FormLabel className="text-sm font-medium text-[#d6d3d1]">Username</FormLabel>
                                <FormControl asChild>
                                    <FormInput type="text" autoComplete="off" placeholder="lowercase_username" value={suUsername} onChange={(e) => setSuUsername(e.target.value)} required className={inputClass} />
                                </FormControl>
                            </FormField>
                            <FormField name="email">
                                <FormLabel className="text-sm font-medium text-[#d6d3d1]">Email</FormLabel>
                                <FormControl asChild>
                                    <FormInput type="email" autoComplete="off" placeholder="you@example.com" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required className={inputClass} />
                                </FormControl>
                            </FormField>
                            <FormField name="password">
                                <FormLabel className="text-sm font-medium text-[#d6d3d1]">Password</FormLabel>
                                <FormControl asChild>
                                    <FormInput type="password" autoComplete="off" placeholder="Password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} required className={inputClass} />
                                </FormControl>
                            </FormField>
                            {suPassword.length > 0 && (
                                <div className={passwordStrong ? statusGood : statusWarn}>
                                    {passwordStrengthMsg}
                                    {passwordStrong && pwBreachLoading && ' Checking breaches...'}
                                    {passwordStrong && !pwBreachLoading && pwBreachCount !== null && (
                                        <> &mdash; {passwordBreachMsg}</>
                                    )}
                                </div>
                            )}
                            <div aria-live="polite">
                                {suError && <div className={statusWarn}>{suError}</div>}
                                {suSuccess && <div className={statusGood}>{suSuccess}</div>}
                            </div>
                            <Button type="submit" className="w-full" disabled={suLoading || !passwordStrong || pwBreachLoading || (pwBreachCount !== null && pwBreachCount > 0)}>
                                {suLoading ? 'Creating account...' : 'Create account'}
                            </Button>
                            <div className="text-center text-sm pt-2 border-t border-white/[0.06]">
                                <a href="/auth/signin" className="text-[#a8a29e] hover:text-white transition-colors">Already have an account? Sign in</a>
                            </div>
                        </Form>
                    )}

                    {mode === 'verify' && (
                        <div>
                            <Button className="w-full" onClick={handleVerify} disabled={verifyLoading || !email || !token}>
                                {verifyLoading ? 'Verifying...' : 'Verify email'}
                            </Button>
                            {verifyStatus && (
                                <div className={`mt-4 ${verifyStatus === 'success' ? statusGood : statusWarn}`}>
                                    {verifyStatus === 'success' ? 'Email verified. Redirecting to sign in...' : verifyStatus}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'forgot' && (
                        <Form onSubmit={handleForgot} autoComplete="off" className="space-y-4">
                            <FormField name="email">
                                <FormLabel className="text-sm font-medium text-[#d6d3d1]">Email</FormLabel>
                                <FormControl asChild>
                                    <FormInput type="email" autoComplete="off" placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className={inputClass} />
                                </FormControl>
                            </FormField>
                            <Button type="submit" className="w-full" disabled={forgotLoading || !forgotEmail}>
                                {forgotLoading ? 'Sending...' : 'Send reset link'}
                            </Button>
                            {forgotStatus && (
                                <div className={forgotStatus === 'success' ? statusGood : statusWarn}>
                                    {forgotStatus === 'success' ? 'If that email is registered, a reset link has been sent.' : forgotStatus}
                                </div>
                            )}
                            <div className="text-center text-sm pt-2 border-t border-white/[0.06]">
                                <a href="/auth/signin" className="text-[#a8a29e] hover:text-white transition-colors">Back to sign in</a>
                            </div>
                        </Form>
                    )}

                    {mode === 'reset' && (
                        <Form onSubmit={handleReset} autoComplete="off" className="space-y-4">
                            <FormField name="password">
                                <FormLabel className="text-sm font-medium text-[#d6d3d1]">New password</FormLabel>
                                <FormControl asChild>
                                    <FormInput type="password" autoComplete="off" placeholder="New password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required className={inputClass} />
                                </FormControl>
                            </FormField>
                            <Button type="submit" className="w-full" disabled={resetLoading || !resetPassword}>
                                {resetLoading ? 'Resetting...' : 'Reset password'}
                            </Button>
                            {resetStatus && (
                                <div className={resetStatus === 'success' ? statusGood : statusWarn}>
                                    {resetStatus === 'success' ? 'Password reset. Redirecting to sign in...' : resetStatus}
                                </div>
                            )}
                        </Form>
                    )}
                </div>

                <AuthFAQ faqs={faqs} />
            </div>
        </div>
    );
}