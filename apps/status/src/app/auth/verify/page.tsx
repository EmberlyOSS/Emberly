'use client';
import AuthCard from '@/components/layouts/auth/AuthCard';
import type { AuthFAQItem } from '@/components/layouts/auth/AuthFAQ';

const verifyFaqs: AuthFAQItem[] = [
    {
        q: 'Why do I need to verify my email?',
        a: 'Email verification helps us keep your account secure and ensures you have access to all features.',
    },
    {
        q: 'My verification link expired. What should I do?',
        a: 'Go back to sign up and request a new verification email, or contact support if you need help.',
    },
    {
        q: 'Can I sign in before verifying?',
        a: 'No, you must verify your email before signing in for the first time.',
    },
    {
        q: 'Need help?',
        a: 'Join our Discord for assistance.',
    },
];

export default function VerifyPage() {
    return (
        <AuthCard
            mode="verify"
            faqs={verifyFaqs}
        />
    );
}
