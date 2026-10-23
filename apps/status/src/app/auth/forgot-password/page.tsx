import AuthCard from '@/components/layouts/auth/AuthCard';
import type { AuthFAQItem } from '@/components/layouts/auth/AuthFAQ';

const forgotFaqs: AuthFAQItem[] = [
    {
        q: 'What happens when I reset my password?',
        a: 'You will receive an email with a secure link to set a new password. Your old password will no longer work.',
    },
    {
        q: 'I did not receive the reset email. What should I do?',
        a: 'Check your spam folder or try again. If you still have issues, join our Discord for help.',
    },
    {
        q: 'Can I use the same password again?',
        a: 'For security, we recommend choosing a new password you have not used before.',
    },
];

export default function ForgotPasswordPage() {
    return (
        <AuthCard
            mode="forgot"
            faqs={forgotFaqs}
        />
    );
}
