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

interface WelcomeEmailProps {
  name?: string
  verificationUrl?: string
}

export function WelcomeEmail({ name = 'there', verificationUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Welcome to Emberly – Get started with secure file sharing</Preview>
      </Head>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-2xl px-4 py-8">
            {/* Header */}
            <Section className="mb-8">
              <Row>
                <Column align="left">
                  <Link href="https://emberly.dev" className="inline-block">
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
                    Welcome Aboard
                  </Text>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Hi {name}! 👋
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                    Thanks for signing up with Emberly. We're excited to have you on board!
                  </Text>
                  <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                    Emberly makes it easy to share files securely with custom domains, rich metadata, and powerful APIs.
                  </Text>
                </Column>
              </Row>

              {/* Features list */}
              <Row className="mt-6">
                <Column>
                  <Text className="m-0 mb-3 font-semibold text-gray-900">
                    Get started with:
                  </Text>
                </Column>
              </Row>

              {[
                { icon: '🔒', title: 'Privacy First', desc: 'End-to-end encryption and password protection' },
                { icon: '⚡', title: 'Lightning Fast', desc: 'CDN-backed delivery and instant short URLs' },
                { icon: '🌍', title: 'Custom Domains', desc: 'Serve files under your own brand' },
              ].map((feature, idx) => (
                <Row key={idx} className="mb-3">
                  <Column className="w-8">
                    <Text className="m-0 text-lg">{feature.icon}</Text>
                  </Column>
                  <Column className="flex-1">
                    <Text className="m-0 font-semibold text-gray-900">
                      {feature.title}
                    </Text>
                    <Text className="m-0 text-sm text-gray-600">
                      {feature.desc}
                    </Text>
                  </Column>
                </Row>
              ))}

              {/* CTA */}
              {verificationUrl && (
                <Row className="mt-8">
                  <Column align="center">
                    <Button
                      href={verificationUrl}
                      className="rounded-lg bg-orange-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
                    >
                      Verify Your Email
                    </Button>
                  </Column>
                </Row>
              )}

              <Row className="mt-6">
                <Column align="center">
                  <Text className="m-0 text-sm text-gray-600">
                    Have questions?{' '}
                    <Link
                      href="https://emberly.dev/contact"
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
                      href="https://emberly.dev/privacy"
                      className="text-gray-400 no-underline mr-3"
                    >
                      Privacy
                    </Link>
                    {' | '}
                    <Link
                      href="https://emberly.dev/terms"
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
