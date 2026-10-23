import AuthCard from '@/components/layouts/auth/AuthCard';
import type { AuthFAQItem } from '@/components/layouts/auth/AuthFAQ';

const signupFaqs: AuthFAQItem[] = [
    {
        q: 'Is this my Emberly account?',
        a: 'No. Status page accounts are separate from your embrly.ca account, so the status page stays reachable even when Emberly itself is down. Create one here with any email you like.',
    },
    {
        q: 'What do I get with an account?',
        a: 'Email alerts for new incidents, incident updates and scheduled maintenance. You can choose which components or groups you care about from your account page.',
    },
    {
        q: 'What are the username and password rules?',
        a: 'Usernames are 3–30 lowercase letters, numbers or underscores. Passwords need at least 8 characters with upper and lower case, a number and a symbol, and can’t appear in known data breaches.',
    },
    {
        q: 'Do I need to verify my email?',
        a: 'Yes. We’ll send you a verification link, and you can sign in once you’ve clicked it.',
    },
];

export default function SignUpPage() {
    return <AuthCard mode="signup" faqs={signupFaqs} />;
}
