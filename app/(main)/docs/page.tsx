import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'
import DocsCard from '@/components/docs/DocsCard'
import DocsAlert from '@/components/docs/DocsAlert'

export default function DocsPage() {
  return (
    <main className="container mx-auto py-2">
      <section className="max-w-7xl mx-auto px-4">
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DocsCard title="Getting Started" href="/docs/getting-started" linkLabel="Open guide">
            Step-by-step setup and deployment instructions for self-hosting Emberly.
          </DocsCard>

          <DocsCard title="API Reference" href="/docs/api" linkLabel="View API">
            Examples for the REST API, authentication, and code samples for common tasks.
          </DocsCard>

          <DocsCard title="User Guide" href="/docs/user" linkLabel="Open User Guide">
            User-facing documentation: profile, uploads, short links, and managing custom domains.
          </DocsCard>

          <DocsCard title="Custom Domains" href="/docs/custom-domains" linkLabel="Read domain guide">
            DNS requirements, verification flow, and Cloudflare provisioning notes for serving content on your own domain.
          </DocsCard>

          <div className="lg:col-span-3">
            <DocsAlert title="Open Source Note">
              Emberly is open-source. This live site includes some proprietary
              pages (pricing, hosted docs). The OSS repo may not include those pages.
            </DocsAlert>
          </div>
        </div>
      </section>
    </main>
  )
}
