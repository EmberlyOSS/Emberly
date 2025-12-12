import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'


import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Getting Started | Emberly',
  description: 'Quick guide to run Emberly locally, perform database migrations, and deploy with Docker Compose.',
}

export default function GettingStarted() {
  return (
    <main className="container mx-auto py-16">
      <section className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-semibold">Getting Started</h1>
        <p className="mt-3 text-muted-foreground">
          Quick guide to run Emberly locally, perform database migrations, and
          deploy with Docker Compose.
        </p>

        <div className="mt-6 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium">Local development</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Clone the repository and install dependencies.
              </p>
              <pre className="mt-3 rounded bg-background/30 p-3 text-xs">
                git clone https://github.com/EmberlyOSS/Emberly.git cd Website
                bun install
              </pre>
              <p className="text-sm text-muted-foreground mt-2">
                Start the dev server:
              </p>
              <pre className="mt-2 rounded bg-background/30 p-3 text-xs">
                bun dev
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium">Prisma migrations</h2>
              <p className="text-sm text-muted-foreground mt-2">
                After changing `schema.prisma`, run migrations locally
                (development only):
              </p>
              <pre className="mt-3 rounded bg-background/30 p-3 text-xs">
                npx prisma migrate dev --name descriptive-name npx prisma
                generate
              </pre>
              <p className="text-sm text-muted-foreground mt-2">
                If you use Docker, apply migrations inside the container or
                during your CI pipeline.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium">Docker Compose (quick)</h2>
              <p className="text-sm text-muted-foreground mt-2">
                A `docker-compose.yml` is included for quick deployment. Ensure
                environment variables are set (database URL, NEXTAUTH secret,
                storage config).
              </p>
              <p className="text-sm text-muted-foreground mt-2">Run:</p>
              <pre className="mt-2 rounded bg-background/30 p-3 text-xs">
                docker-compose up -d --build
              </pre>
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground">
            <p>
              See the{' '}
              <Link href="/docs/api" className="underline">
                API Reference
              </Link>{' '}
              for endpoint details and the{' '}
              <Link href="/legal" className="underline">
                Legal
              </Link>{' '}
              pages for privacy and security guidance.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
