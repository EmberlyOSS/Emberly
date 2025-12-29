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
  Code,
} from '@react-email/components'
import { Tailwind } from '@react-email/tailwind'

interface VerificationCodeEmailProps {
  code: string
  verificationUrl?: string
  expiresInMinutes?: number
}

export function VerificationCodeEmail({
  code,
  verificationUrl,
  expiresInMinutes = 30,
}: VerificationCodeEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Your Emberly verification code: {code}</Preview>
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
                  <Text className="m-0 mb-2 text-sm font-semibold text-orange-600 uppercase tracking-wide">
                    Verification Code
                  </Text>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Verify your email
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    Your verification code is:
                  </Text>
                </Column>
              </Row>

              {/* Code display - Copy friendly */}
              <Row>
                <Column align="center">
                  <div className="rounded-lg bg-gray-100 p-4 mb-6 text-center">
                    <Text className="m-0 text-3xl font-mono font-bold tracking-wider text-gray-900">
                      {code}
                    </Text>
                  </div>
                </Column>
              </Row>

              {/* CTA Button */}
              {verificationUrl && (
                <Row className="mb-6">
                  <Column align="center">
                    <Button
                      href={verificationUrl}
                      className="rounded-lg bg-orange-600 px-8 py-3 text-center text-base font-semibold text-white no-underline"
                    >
                      Verify Email Address
                    </Button>
                  </Column>
                </Row>
              )}

              {/* Info */}
              <Row>
                <Column align="center">
                  <Text className="m-0 text-sm text-gray-600 mb-2">
                    Can't click the button? Enter this code:
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-sm text-gray-600">
                    This code expires in <strong>{expiresInMinutes} minutes</strong>.
                  </Text>
                  <Text className="m-0 text-sm text-gray-600">
                    If you didn't request this code, you can safely ignore this email.
                  </Text>
                </Column>
              </Row>

              {/* Security note */}
              <Row className="mt-6">
                <Column className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <Text className="m-0 text-sm text-blue-900">
                    🔒 <strong>Security tip:</strong> Never share this code with anyone. Emberly staff will never ask for it.
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
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
