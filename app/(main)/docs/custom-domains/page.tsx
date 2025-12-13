import Link from 'next/link'

// Cards removed for cleaner doc layout; using plain sections with spacing


import { Metadata } from 'next'
import PageShell from '@/components/layout/PageShell'

export const metadata: Metadata = {
    title: 'Custom Domains | Emberly',
    description: 'Guide to adding and verifying custom domains, DNS requirements, and Cloudflare provisioning flow used by Emberly.',
}

export default function CustomDomainsGuide() {
    return (
        <PageShell title="Custom Domains" subtitle="Guide to adding and verifying custom domains, DNS requirements, and Cloudflare provisioning flow used by Emberly.">
            <section className="max-w-5xl mx-auto px-4">
                <div className="mt-6 space-y-6">
                    <section className="p-6">
                        <h2 className="font-medium">Overview</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Emberly supports serving uploads and short links from verified
                            custom hostnames. We recommend Cloudflare for TLS automation and
                            DNS APIs.
                        </p>
                    </section>

                    <section className="p-6">
                        <h2 className="font-medium">DNS Requirements</h2>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                            <li>
                                Provide a CNAME record pointing your hostname (e.g. <code>www</code>
                                or <code>@</code> when supported) to the configured CNAME target
                                (see <code>CNAME_TARGET</code> in your instance config).
                            </li>
                            <li>
                                For root domains where CNAME is not possible, use an ALIAS/ANAME
                                if your DNS provider supports it, or use a subdomain (recommended).
                            </li>
                            <li>
                                TXT records may be required for ownership verification; Emberly
                                will surface the necessary TXT value when adding the domain.
                            </li>
                        </ul>
                    </section>

                    <section className="p-6">
                        <h2 className="font-medium">Verification & Cloudflare</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Emberly performs a DNS-first check to ensure the required CNAME
                            or TXT records exist before attempting to create a Cloudflare
                            Custom Hostname. This avoids provisioning failures and ensures
                            certificate issuance succeeds.
                        </p>
                        <div className="mt-3 text-sm text-muted-foreground">
                            <div className="font-medium">Endpoints</div>
                            <ul className="list-disc pl-5 mt-2">
                                <li>
                                    POST <code>/api/domains</code> — add domain (auth: session).
                                    Domain will be created with status <code>awaiting_cname</code>.
                                </li>
                                <li>
                                    POST <code>/api/domains/[id]/cf-check</code> — server will
                                    verify DNS and then attempt Cloudflare provisioning (auth: session).
                                </li>
                                <li>
                                    GET <code>/api/domains</code> — list user's domains (auth: session).
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section className="p-6">
                        <h2 className="font-medium">Troubleshooting</h2>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                            <li>Ensure DNS changes have fully propagated (may take minutes).</li>
                            <li>Check your registrar/DNS provider for proxy settings — disable proxying while verifying CNAME if necessary.</li>
                            <li>Confirm the CNAME target matches the instance's configured target.</li>
                        </ul>
                    </section>

                    <div className="text-sm text-muted-foreground">
                        <p>
                            Return to{' '}
                            <Link href="/docs" className="underline">
                                Docs
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </section>
        </PageShell>
    )
}
