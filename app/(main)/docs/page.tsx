import Link from 'next/link'

import { Card, CardContent } from '@/packages/components/ui/card'
import DocsCard from '@/packages/components/docs/DocsCard'
import DocsAlert from '@/packages/components/docs/DocsAlert'
import PageShell from '@/packages/components/layout/PageShell'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/packages/components/ui/table'

export const metadata = {
  title: 'Documentation | Emberly',
  description: 'Guides, API reference, and examples to help you get started with Emberly.',
}

export default function DocsPage() {
  return (
    <PageShell title="Documentation" subtitle="Guides, API reference, and user docs for Emberly.">
      <section className="max-w-7xl mx-auto px-4">
        <div className="mt-8">
          <div className="rounded-2xl border border-border/30 bg-background/40 p-4">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Document</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead />
                </tr>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">
                      <Link href="/docs/getting-started" className="hover:underline">Getting Started</Link>
                    </div>
                  </TableCell>
                  <TableCell>Step-by-step setup and deployment instructions for self-hosting Emberly.</TableCell>
                  <TableCell>
                    <Link href="/docs/getting-started" className="text-primary font-medium">Read</Link>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <div className="font-medium">
                      <Link href="/docs/api" className="hover:underline">API Reference</Link>
                    </div>
                  </TableCell>
                  <TableCell>Examples for the REST API, authentication, and code samples.</TableCell>
                  <TableCell>
                    <Link href="/docs/api" className="text-primary font-medium">Read</Link>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <div className="font-medium">
                      <Link href="/docs/user" className="hover:underline">User Guide</Link>
                    </div>
                  </TableCell>
                  <TableCell>User-facing documentation: profile, uploads, short links, and managing custom domains.</TableCell>
                  <TableCell>
                    <Link href="/docs/user" className="text-primary font-medium">Read</Link>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <div className="font-medium">
                      <Link href="/docs/user/flameshot" className="hover:underline">Flameshot</Link>
                    </div>
                  </TableCell>
                  <TableCell>Quick guide for capturing, annotating, and uploading screenshots using Flameshot (Linux).</TableCell>
                  <TableCell>
                    <Link href="/docs/user/flameshot" className="text-primary font-medium">Read</Link>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <div className="font-medium">
                      <Link href="/docs/user/sharex" className="hover:underline">ShareX</Link>
                    </div>
                  </TableCell>
                  <TableCell>Quick setup for ShareX and how to use it with Emberly (Windows).</TableCell>
                  <TableCell>
                    <Link href="/docs/user/sharex" className="text-primary font-medium">Read</Link>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <div className="font-medium">
                      <Link href="/docs/custom-domains" className="hover:underline">Custom Domains</Link>
                    </div>
                  </TableCell>
                  <TableCell>DNS requirements, verification flow, and Cloudflare provisioning notes.</TableCell>
                  <TableCell>
                    <Link href="/docs/custom-domains" className="text-primary font-medium">Read</Link>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="lg:col-span-3 mt-6">
            <DocsAlert title="Open Source Note">
              Emberly is open-source. This live site includes some proprietary
              pages (pricing, hosted docs). The OSS repo may not include those pages.
            </DocsAlert>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
