import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <main className="container mx-auto py-16">
      <section className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-semibold">About Emberly</h1>
        <p className="mt-4 text-muted-foreground">
          Emberly is a lightweight, developer-first file sharing platform
          focused on privacy, reliability, and simplicity. Built by a small team
          of open-source contributors.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium">Our mission</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Make private, reliable file sharing accessible and easy to
                self-host for teams and communities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium">Contributors</h3>
              <p className="text-sm text-muted-foreground mt-2">
                We welcome contributors — check our GitHub repository for open
                issues and contribution guidelines.
              </p>
              <div className="mt-4">
                <Link
                  href="https://github.com/EmberlyOSS"
                  className="text-sm underline"
                >
                  View on GitHub
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
