import { Metadata } from 'next'
import PageShell from '@/packages/components/layout/PageShell'
import MarkdownRenderer from '@/packages/components/docs/MarkdownRenderer'

export const metadata: Metadata = {
    title: 'User Guide | Emberly',
    description: 'User facing documentation covering uploads, profiles, short links, privacy controls, and domain management.',
}

export default function UserGuide() {
    const markdown = `## Uploads
Upload files via the dashboard or the API. You can set visibility (public/private), add expirations, and protect with a password.

## Profile & Account
Update your profile, change passwords, and configure preferences such as randomized file URLs or rich embeds.

## Short Links
Create and manage short URLs from the dashboard or using the API. Only authenticated users can create or manage links tied to their account.

## Custom Domains
Add verified domains in your profile to serve content from your own hostname. For detailed DNS and Cloudflare provisioning steps, see the [domain guide](/docs/custom-domains).

## Screenshots & Quick Uploads
Guides for common screenshot tools and how to get images into Emberly:
- [Flameshot (Linux)](/docs/user/flameshot)
- [ShareX (Windows)](/docs/user/sharex)

Need more help? Open an issue or check the support channels.
`

    return (
        <PageShell title="User Guide" subtitle="User facing documentation covering uploads, profiles, short links, privacy controls, and domain management.">
            <section className="max-w-5xl mx-auto px-4">
                <div className="mt-6">
                    <div className="prose prose-invert max-w-none">
                        <MarkdownRenderer>{markdown}</MarkdownRenderer>
                    </div>
                </div>
            </section>
        </PageShell>
    )
}
