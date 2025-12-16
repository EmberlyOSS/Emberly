import Link from 'next/link'


import { Metadata } from 'next'
import PageShell from '@/components/layout/PageShell'

export const metadata: Metadata = {
    title: 'User Guide | Emberly',
    description: 'User facing documentation covering uploads, profiles, short links, privacy controls, and domain management.',
}

export default function UserGuide() {
    return (
        <PageShell title="User Guide" subtitle="User facing documentation covering uploads, profiles, short links, privacy controls, and domain management.">
            <section className="max-w-5xl mx-auto px-4">
                <div className="mt-6 space-y-6">
                    <section className="p-6">
                        <h2 className="font-medium">Uploads</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Upload files via the dashboard or the API. You can set visibility
                            (public/private), add expirations, and protect with a password.
                        </p>
                    </section>

                    <section className="p-6">
                        <h2 className="font-medium">Profile & Account</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Update your profile, change passwords, and configure preferences
                            such as randomized file URLs or rich embeds.
                        </p>
                    </section>

                    <section className="p-6">
                        <h2 className="font-medium">Short Links</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Create and manage short URLs from the dashboard or using the
                            API. Only authenticated users can create/manage links tied to
                            their account.
                        </p>
                    </section>

                    <section className="p-6">
                        <h2 className="font-medium">Custom Domains</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Add verified domains in your profile to serve content from your
                            own hostname. For detailed DNS and Cloudflare provisioning
                            steps, see the domain guide.
                        </p>
                        <div className="mt-4">
                            <Link href="/docs/custom-domains" className="text-sm underline">
                                Domain guide
                            </Link>
                        </div>
                    </section>

                    <section className="p-6">
                        <h2 className="font-medium">Screenshots & Quick Uploads</h2>
                        <p className="text-sm text-muted-foreground mt-2">Guides for common screenshot tools and how to get images into Emberly:</p>
                        <div className="mt-4 space-x-4">
                            <Link href="/docs/user/flameshot" className="text-sm underline">Flameshot (Linux)</Link>
                            <Link href="/docs/user/sharex" className="text-sm underline">ShareX (Windows)</Link>
                        </div>
                    </section>

                    <div className="text-sm text-muted-foreground">
                        <p>Need more help? Open an issue or check the support channels.</p>
                    </div>
                </div>
            </section>
        </PageShell>
    )
}
