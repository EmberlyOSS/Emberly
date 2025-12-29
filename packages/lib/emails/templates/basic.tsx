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

interface BasicEmailProps {
  title: string
  preheader?: string
  headline?: string
  body: string[]
  cta?: { label: string; href: string }
  footerNote?: string
}

export function BasicEmail({
  title,
  preheader,
  headline = title,
  body,
  cta,
  footerNote = '© 2025 Emberly. All rights reserved.',
}: BasicEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>{preheader || headline || title}</Preview>
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
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    {headline}
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  {body.map((line, idx) => (
                    <Text
                      key={idx}
                      className="m-0 mb-4 text-base leading-relaxed text-gray-700"
                    >
                      {line}
                    </Text>
                  ))}
                </Column>
              </Row>

              {/* CTA Button */}
              {cta && (
                <Row className="mt-6">
                  <Column align="center">
                    <Button
                      href={cta.href}
                      className="rounded-lg bg-orange-600 px-8 py-3 text-center text-base font-semibold text-white no-underline"
                    >
                      {cta.label}
                    </Button>
                  </Column>
                </Row>
              )}
            </Section>

            {/* Footer */}
            <Section className="mt-12">
              <Hr className="border border-gray-200" />
              <Row className="mt-8">
                <Column align="center">
                  <Text className="m-0 text-xs text-gray-500">
                    {footerNote}
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
