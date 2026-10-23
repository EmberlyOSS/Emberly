import AuthCard from '@/components/layouts/auth/AuthCard';
import type { AuthFAQItem } from '@/components/layouts/auth/AuthFAQ';

const resetFaqs: AuthFAQItem[] = [
    {
        q: 'How secure is the password reset?',
        a: 'Reset links are single-use and expire after a short period. Always use a strong, unique password.',
    },
    {
        q: 'What if my reset link expired?',
        a: 'Go back to forgot password and request a new link.',
    },
    {
        q: 'Can support reset my password for me?',
        a: 'For security, only you can reset your password using your email.',
    },
];

export default function ResetPasswordPage() {
    return <AuthCard mode="reset" faqs={resetFaqs} />;
}
