import Link from 'next/link'

import { Card, CardContent } from '@/packages/components/ui/card'

export default function PressPage() {
  return (
    <main className="container mx-auto py-16">
      <section className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-semibold">Press & Media</h1>
        <p className="mt-3 text-muted-foreground">
          Assets, logos, and a short media kit for press enquiries.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium">Media kit</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Download logos, screenshots, and brand guidelines.
              </p>
              <div className="mt-4">
                <Link href="/press/media-kit" className="text-sm underline">
                  Open media kit
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium">Contact</h3>
              <p className="text-sm text-muted-foreground mt-2">
                For press inquiries, please open an issue or contact the
                maintainers via GitHub.
              </p>
              <div className="mt-4">
                <Link
                  href="https://github.com/EmberlyOSS/Website/issues"
                  className="text-sm underline"
                >
                  Open an issue
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
