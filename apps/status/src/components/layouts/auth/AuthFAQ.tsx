export type AuthFAQItem = { q: string; a: string };

export default function AuthFAQ({ faqs }: { faqs?: AuthFAQItem[] }) {
    const defaultFaqs: AuthFAQItem[] = [
        { q: 'Username requirements?', a: 'Usernames must be 3-30 characters and may contain lowercase letters, numbers, and underscores.' },
        { q: 'Can I access admin pages?', a: 'Admin pages are restricted to users with SUPER_ADMIN or ADMINISTRATOR roles. Contact an existing admin if you need access.' },
        { q: 'Password requirements?', a: 'At least 8 characters, with uppercase, lowercase, a number, and a special character. We store passwords hashed and never send them in email.' },
        { q: 'Need help?', a: 'Join our Discord for assistance.' },
    ];

    const items = faqs ?? defaultFaqs;

    return (
        <div className="mt-10">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">Questions</p>
            <div className="glass-card divide-y divide-white/[0.06] overflow-hidden">
                {items.map((f, idx) => (
                    <details key={idx} className="group">
                        <summary className="flex items-center justify-between cursor-pointer select-none px-4 py-3 text-sm text-white font-medium hover:bg-white/[0.03] transition-colors list-none">
                            <span>{f.q}</span>
                            <span className="text-[#78716c] ml-3 shrink-0 group-open:rotate-180 transition-transform text-xs">&#9660;</span>
                        </summary>
                        <div className="px-4 pb-4 pt-0 text-sm text-[#a8a29e] leading-relaxed">
                            {f.a}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
}