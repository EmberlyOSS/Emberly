'use client';

import AuthCard from '@/components/layouts/auth/AuthCard';
import type { AuthFAQItem } from '@/components/layouts/auth/AuthFAQ';

const signinFaqs: AuthFAQItem[] = [
    {
        q: 'Can I sign in with my Emberly account?',
        a: 'Not yet. Status page accounts are separate from embrly.ca accounts, so the status page keeps working even when Emberly is down. Create a status account if you don’t have one.',
    },
    {
        q: 'Do I need an account to see the status?',
        a: 'No. Everything on the status page is public. An account is only needed to subscribe to email alerts.',
    },
    {
        q: 'I forgot my password',
        a: 'Use “Forgot password?” below and we’ll email you a secure reset link.',
    },
    {
        q: 'It says my email isn’t verified',
        a: 'Click the link in the verification email we sent when you signed up. Check your spam folder if you can’t find it.',
    },
];

export default function SignInPage() {
    return <AuthCard mode="signin" faqs={signinFaqs} />;
}
