import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'

export default function DocsPage() {
  return (
    <main className="container mx-auto py-16">
      <section className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-semibold">Documentation</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Guides, API reference, and examples to help you get started with
          Emberly.
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium">Getting Started</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Step-by-step setup and deployment instructions for self-hosting
                Emberly.
              </p>
              <div className="mt-4">
                <Link
                  href="/docs/getting-started"
                  className="text-sm underline"
                >
                  Open guide
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium">API Reference</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Examples for the REST API, authentication, and code samples for
                common tasks.
              </p>
              <div className="mt-4">
                <Link href="/docs/api" className="text-sm underline">
                  View API
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium">Integrations & Examples</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Prebuilt examples (CLI, SDKs, embed snippets) to help you
                integrate Emberly.
              </p>
              <div className="mt-4">
                <Link href="/docs/examples" className="text-sm underline">
                  See examples
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
