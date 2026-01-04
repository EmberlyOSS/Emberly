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

interface MagicLinkEmailProps {
  magicLink: string
  email: string
  expiresInMinutes?: number
}

export function MagicLinkEmail({
  magicLink,
  email,
  expiresInMinutes = 15,
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Sign in to your Emberly account</Preview>
      </Head>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-2xl px-4 py-8">
            {/* Header */}
            <Section className="mb-8">
              <Row>
                <Column align="left">
                  <Link href="https://emberly.ca" className="inline-block">
                    <Text className="m-0 text-xl font-bold text-orange-600">
                      Emberly
                    </Text>
                  </Link>
                </Column>
              </Row>
            </Section>

            {/* Alert Banner */}
            <Section className="mb-6 border-l-4 border-blue-500 rounded-lg bg-blue-50 p-4">
              <Text className="m-0 text-sm font-semibold text-blue-800">
                🔐 Magic Link Login
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Sign in to Emberly
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-2 text-base leading-relaxed text-gray-700">
                    Click the button below to sign in to your Emberly account.
                  </Text>
                  <Text className="m-0 mb-6 text-sm text-gray-600">
                    This link is for: <strong>{email}</strong>
                  </Text>
                </Column>
              </Row>

              {/* CTA Button */}
              <Row>
                <Column align="center">
                  <Button
                    href={magicLink}
                    className="rounded-lg bg-orange-600 px-8 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    Sign In to Emberly
                  </Button>
                </Column>
              </Row>

              {/* Expiry warning */}
              <Row className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <Column align="center">
                  <Text className="m-0 text-sm text-yellow-800">
                    <strong>⏰ This link expires in {expiresInMinutes} minutes</strong>
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
                    href={magicLink}
                    className="text-orange-600 no-underline break-all text-xs"
                  >
                    {magicLink}
                  </Link>
                </Column>
              </Row>

              {/* Security info */}
              <Row className="mt-6">
                <Column className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <Text className="m-0 text-sm text-blue-900">
                    <strong>Didn't request this?</strong> If you didn't request a sign-in link, you can safely ignore this email. This link is unique and only works for your account.
                  </Text>
                </Column>
              </Row>

              {/* Info */}
              <Row className="mt-4">
                <Column>
                  <Text className="m-0 text-xs text-gray-600">
                    <strong>About magic links:</strong> This is a secure way to sign in without remembering a password. The link is unique to you and only works once.
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
