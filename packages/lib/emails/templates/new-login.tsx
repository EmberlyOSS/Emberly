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

interface NewLoginEmailProps {
  loginLocation?: string
  loginTime?: string
  loginDevice?: string
  reviewUrl?: string
}

export function NewLoginEmail({
  loginLocation = 'Unknown location',
  loginTime = new Date().toLocaleString(),
  loginDevice = 'Unknown device',
  reviewUrl = 'https://embrly.ca/me?tab=security',
}: NewLoginEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>New login to your Emberly account</Preview>
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

            {/* Alert Banner */}
            <Section className="mb-6 border-l-4 border-yellow-500 rounded-lg bg-yellow-50 p-4">
              <Text className="m-0 text-sm font-semibold text-yellow-800">
                ⚠️ New Login Activity
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    New login detected
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    We detected a new login to your Emberly account. If this was you, no action is needed. If this wasn't you, please review the details below and secure your account.
                  </Text>
                </Column>
              </Row>

              {/* Login Details */}
              <Section className="mb-6 rounded-lg bg-gray-50 p-4 border border-gray-200">
                <Row className="mb-4">
                  <Column className="w-32">
                    <Text className="m-0 text-sm font-semibold text-gray-700">
                      📍 Location:
                    </Text>
                  </Column>
                  <Column>
                    <Text className="m-0 text-sm text-gray-600">
                      {loginLocation}
                    </Text>
                  </Column>
                </Row>

                <Row className="mb-4">
                  <Column className="w-32">
                    <Text className="m-0 text-sm font-semibold text-gray-700">
                      ⏰ Time:
                    </Text>
                  </Column>
                  <Column>
                    <Text className="m-0 text-sm text-gray-600">
                      {loginTime}
                    </Text>
                  </Column>
                </Row>

                <Row>
                  <Column className="w-32">
                    <Text className="m-0 text-sm font-semibold text-gray-700">
                      💻 Device:
                    </Text>
                  </Column>
                  <Column>
                    <Text className="m-0 text-sm text-gray-600">
                      {loginDevice}
                    </Text>
                  </Column>
                </Row>
              </Section>

              {/* CTA Button */}
              <Row>
                <Column align="center">
                  <Button
                    href={reviewUrl}
                    className="rounded-lg bg-orange-600 px-8 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    Review Activity
                  </Button>
                </Column>
              </Row>

              {/* Security actions */}
              <Row className="mt-6">
                <Column className="rounded-lg bg-red-50 p-4 border border-red-200">
                  <Text className="m-0 text-sm font-semibold text-red-900 mb-2">
                    🔒 Suspicious activity?
                  </Text>
                  <Text className="m-0 text-sm text-red-900">
                    If you don't recognize this login, we recommend:
                  </Text>
                  <Text className="m-0 text-sm text-red-900 mt-2">
                    1. Change your password immediately
                  </Text>
                  <Text className="m-0 text-sm text-red-900">
                    2. Enable two-factor authentication
                  </Text>
                  <Text className="m-0 text-sm text-red-900">
                    3. Review your account activity
                  </Text>
                </Column>
              </Row>

              {/* Footer note */}
              <Row className="mt-6">
                <Column>
                  <Text className="m-0 text-xs text-gray-600">
                    <strong>Why are you receiving this?</strong> We send notifications for new logins to help keep your account secure.
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
                    © {new Date().getFullYear()} Emberly. All rights reserved.
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
