import React from 'react'
import {
  Container,
  Head,
  Html,
  Body,
  Section,
  Row,
  Column,
  Text,
  Link,
  Button,
  Hr,
  Preview,
} from '@react-email/components'
import { Tailwind } from '@react-email/tailwind'

interface NexiumWelcomeEmailProps {
  name?: string
  profileUrl: string
  profileId: string
}

export function NexiumWelcomeEmail({
  name = 'there',
  profileUrl,
  profileId,
}: NexiumWelcomeEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Your Nexium profile is live – Start connecting with opportunities</Preview>
      </Head>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-2xl px-4 py-8">
            {/* Header */}
            <Section className="mb-8">
              <Row>
                <Column align="left">
                  <Link href="https://embrly.ca" className="inline-block">
                    <Text className="m-0 text-xl font-bold text-orange-600">
                      Emberly
                    </Text>
                  </Link>
                </Column>
              </Row>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-gradient-to-br from-orange-50 to-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-2 text-sm font-semibold text-orange-600 uppercase tracking-wide">
                    Nexium Profile Created
                  </Text>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Hi {name}! 🚀
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                    Welcome to Nexium – your professional profile is live and ready to be discovered by teams and opportunities that match your skills.
                  </Text>
                  <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                    Your profile ID is <strong>{profileId}</strong>. Share your profile link to start making connections.
                  </Text>
                </Column>
              </Row>

              {/* Tips list */}
              <Row className="mt-6">
                <Column>
                  <Text className="m-0 mb-3 font-semibold text-gray-900">
                    Tips to make your profile shine:
                  </Text>
                </Column>
              </Row>

              {[
                { icon: '🎯', title: 'List Your Skills', desc: 'Add specific technologies and expertise so the right opportunities find you' },
                { icon: '📝', title: 'Write a Strong Bio', desc: 'Describe what you build, what you value, and what you\'re looking for' },
                { icon: '🔗', title: 'Link Your Work', desc: 'Connect your GitHub, portfolio, or projects to back up your skills' },
              ].map((tip, idx) => (
                <Row key={idx} className="mb-3">
                  <Column className="w-8">
                    <Text className="m-0 text-lg">{tip.icon}</Text>
                  </Column>
                  <Column className="flex-1">
                    <Text className="m-0 font-semibold text-gray-900">
                      {tip.title}
                    </Text>
                    <Text className="m-0 text-sm text-gray-600">
                      {tip.desc}
                    </Text>
                  </Column>
                </Row>
              ))}

              {/* CTA */}
              <Row className="mt-8">
                <Column align="center">
                  <Button
                    href={profileUrl}
                    className="rounded-lg bg-orange-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    View Your Profile
                  </Button>
                </Column>
              </Row>

              <Row className="mt-6">
                <Column align="center">
                  <Text className="m-0 text-sm text-gray-600">
                    Questions about Nexium?{' '}
                    <Link
                      href="https://embrly.ca/contact"
                      className="text-orange-600 font-semibold no-underline"
                    >
                      Get in touch
                    </Link>
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Footer */}
            <Section className="mt-12">
              <Hr className="border border-gray-200" />
              <Row className="mt-8">
                <Column align="center">
                  <Text className="m-0 text-xs text-gray-500">
                    © 2025 Emberly. All rights reserved.
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column align="center">
                  <Text className="m-0 mt-2 text-xs text-gray-400">
                    <Link
                      href="https://embrly.ca/legal/privacy"
                      className="text-gray-400 no-underline mr-3"
                    >
                      Privacy
                    </Link>
                    {' | '}
                    <Link
                      href="https://embrly.ca/legal/terms"
                      className="text-gray-400 no-underline ml-3"
                    >
                      Terms
                    </Link>
                  </Text>
                </Column>
              </Row>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
