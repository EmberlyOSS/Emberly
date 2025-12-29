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

interface PasswordResetEmailProps {
  resetUrl: string
  expiresInHours?: number
}

export function PasswordResetEmail({
  resetUrl,
  expiresInHours = 1,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Reset your Emberly password</Preview>
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
            <Section className="mb-6 border-l-4 border-red-500 rounded-lg bg-red-50 p-4">
              <Text className="m-0 text-sm font-semibold text-red-800">
                🔒 Password Reset Request
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Reset your password
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    We received a request to reset the password for your Emberly account. Click the button below to create a new password.
                  </Text>
                </Column>
              </Row>

              {/* CTA Button */}
              <Row>
                <Column align="center">
                  <Button
                    href={resetUrl}
                    className="rounded-lg bg-red-600 px-8 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    Reset Password
                  </Button>
                </Column>
              </Row>

              {/* Expiry warning */}
              <Row className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <Column align="center">
                  <Text className="m-0 text-sm text-yellow-800">
                    <strong>⏰ This link expires in {expiresInHours} hour{expiresInHours > 1 ? 's' : ''}</strong>
                  </Text>
                </Column>
              </Row>

              {/* Fallback link */}
              <Row className="mt-6">
                <Column align="center">
                  <Text className="m-0 text-xs text-gray-500 mb-2">
                    Or copy and paste this link:
                  </Text>
                  <Link
                    href={resetUrl}
                    className="text-orange-600 no-underline break-all text-xs"
                  >
                    {resetUrl}
                  </Link>
                </Column>
              </Row>

              {/* Security info */}
              <Row className="mt-6">
                <Column className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <Text className="m-0 text-sm text-blue-900">
                    <strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email or{' '}
                    <Link
                      href="https://emberly.dev/contact"
                      className="text-blue-700 font-semibold no-underline"
                    >
                      contact support
                    </Link>{' '}
                    if you have concerns.
                  </Text>
                </Column>
              </Row>

              {/* Security tips */}
              <Row className="mt-4">
                <Column>
                  <Text className="m-0 text-xs text-gray-600">
                    <strong>Security tips:</strong>
                  </Text>
                  <Text className="m-0 text-xs text-gray-600 mt-1">
                    • Use a strong, unique password
                  </Text>
                  <Text className="m-0 text-xs text-gray-600">
                    • Don't share your password with anyone
                  </Text>
                  <Text className="m-0 text-xs text-gray-600">
                    • Consider enabling two-factor authentication
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
