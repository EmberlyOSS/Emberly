import { Bell, Code, Star, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discord | Emberly',
  description: 'Join the Emberly community on Discord for support, announcements, and more.',
}

export default function DiscordPage() {
  return (
    <main className="container mx-auto py-12">
      <section className="max-w-7xl mx-auto px-4">
        <div className="rounded-2xl overflow-hidden relative bg-gradient-to-br from-primary/10 to-accent/6 p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-60" />
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl font-semibold">
                Join the Emberly Community
              </h1>
              <p className="mt-3 text-muted-foreground max-w-xl">
                Hang out with other Emberly users, get help, share tips, and
                stay up to date with announcements. Our Discord is the best
                place to chat in real-time and meet fellow builders.
              </p>

              <div className="mt-6 flex items-center gap-3">
                <Button asChild size="lg">
                  <a
                    href="https://discord.gg/k2QAfkwDwK"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join the Discord
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="flex gap-3 items-center justify-center">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium mt-2">Community Support</div>
                    <div className="text-sm text-muted-foreground">
                      Ask questions and get help from the community.
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex gap-3 items-center justify-center">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium mt-2">Announcements</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified about releases and updates first.
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex gap-3 items-center justify-center">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium mt-2">Showcase</div>
                    <div className="text-sm text-muted-foreground">
                      Share projects and integrations built with Emberly.
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex gap-3 items-center justify-center">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium mt-2">Integrations</div>
                    <div className="text-sm text-muted-foreground">
                      Discuss plugins, tooling, and API usage with fellow devs.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc ml-5">
                <li>Be respectful and treat others with courtesy.</li>
                <li>No spam or self-promotion without permission.</li>
                <li>
                  Use channels appropriately (support, showcase, off-topic).
                </li>
                <li>Follow the Discord Terms of Service.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                If you have account or billing questions, please open a support
                ticket in the Discord or email the team.
              </p>
              <p className="text-xs">
                By joining, you agree to follow our community guidelines and the
                Terms of Service.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
