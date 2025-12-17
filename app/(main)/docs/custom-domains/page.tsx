import { Metadata } from 'next'
import PageShell from '@/packages/components/layout/PageShell'
import MarkdownRenderer from '@/packages/components/docs/MarkdownRenderer'

export const metadata: Metadata = {
    title: 'Custom Domains | Emberly',
    description: 'Guide to adding and verifying custom domains, DNS requirements, and Cloudflare provisioning flow used by Emberly.',
}

export default function CustomDomainsGuide() {
    const markdown = `## Overview
Emberly supports serving uploads and short links from verified custom hostnames. We recommend Cloudflare for TLS automation and DNS APIs.

## DNS Requirements
- Provide a CNAME record pointing your hostname (e.g. \`www\` or \`@\` when supported) to the configured CNAME target (see \`CNAME_TARGET\` in your instance config).
- For root domains where CNAME is not possible, use an ALIAS/ANAME if your DNS provider supports it, or use a subdomain (recommended).
- TXT records may be required for ownership verification; Emberly will surface the necessary TXT value when adding the domain.

## Verification & Cloudflare
Emberly performs a DNS-first check to ensure the required CNAME or TXT records exist before attempting to create a Cloudflare Custom Hostname. This avoids provisioning failures and ensures certificate issuance succeeds.

### Endpoints
- **POST** \`/api/domains\` — add domain (auth: session). Domain will be created with status \`awaiting_cname\`.
- **POST** \`/api/domains/[id]/cf-check\` — server verifies DNS then attempts Cloudflare provisioning (auth: session).
- **GET** \`/api/domains\` — list user's domains (auth: session).

## Troubleshooting
- Ensure DNS changes have fully propagated (may take minutes).
- Check your registrar/DNS provider for proxy settings — disable proxying while verifying CNAME if necessary.
- Confirm the CNAME target matches the instance's configured target.

Return to [Docs](/docs).
`

    return (
        <PageShell title="Custom Domains" subtitle="Guide to adding and verifying custom domains, DNS requirements, and Cloudflare provisioning flow used by Emberly.">
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
