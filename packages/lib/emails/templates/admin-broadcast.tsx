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

interface AdminBroadcastEmailProps {
  subject: string
  body: string
  senderName?: string
  priority?: 'low' | 'normal' | 'high'
  ctaLabel?: string
  ctaHref?: string
}

export function AdminBroadcastEmail({
  subject,
  body,
  senderName = 'Emberly Team',
  priority = 'normal',
  ctaLabel,
  ctaHref,
}: AdminBroadcastEmailProps) {
  const isUrgent = priority === 'high'
  return (
    <Html>
      <Head>
        <Preview>{subject}</Preview>
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

            {/* Alert Banner */}
            <Section
              className={`mb-6 border-l-4 rounded-lg p-4 ${
                isUrgent
                  ? 'border-red-500 bg-red-50'
                  : 'border-blue-500 bg-blue-50'
              }`}
            >
              <Text
                className={`m-0 text-sm font-semibold ${
                  isUrgent ? 'text-red-800' : 'text-blue-800'
                }`}
              >
                {isUrgent ? '🚨 Important Notice' : '📢 Announcement'}
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    {subject}
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    {body}
                  </Text>
                </Column>
              </Row>

              {/* CTA Button */}
              {ctaLabel && ctaHref && (
                <Row>
                  <Column align="center">
                    <Button
                      href={ctaHref}
                      className="rounded-lg bg-orange-600 px-8 py-3 text-center text-base font-semibold text-white no-underline"
                    >
                      {ctaLabel}
                    </Button>
                  </Column>
                </Row>
              )}

              {/* Footer note */}
              <Row className="mt-6">
                <Column>
                  <Text className="m-0 text-xs text-gray-600">
                    <strong>Questions?</strong> Please reach out to the Emberly team via{' '}
                    <Link
                      href="https://emberly.dev/contact"
                      className="text-orange-600 no-underline font-semibold"
                    >
                      contact
                    </Link>
                    .
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Bottom Footer */}
            <Section className="mt-12">
              <Hr className="border border-gray-200" />
              <Row className="mt-8">
                <Column align="center">
                  <Text className="m-0 text-xs text-gray-500">
                    © 2025 Emberly. All rights reserved.
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
