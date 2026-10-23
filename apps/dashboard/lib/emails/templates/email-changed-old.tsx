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

interface EmailChangedOldEmailProps {
  oldEmail: string
  newEmail: string
  changedAt: string
  changedBy?: string
}

export function EmailChangedOldEmail({
  oldEmail,
  newEmail,
  changedAt,
  changedBy = 'you',
}: EmailChangedOldEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Your Emberly email address was changed</Preview>
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
                ⚠️ Email Address Changed
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Email address changed
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                    Your Emberly account email address has been changed{' '}
                    {changedBy}.
                  </Text>
                  <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                    <strong>Old email:</strong> {oldEmail}
                  </Text>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    <strong>New email:</strong> {newEmail}
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-sm text-gray-600">
                    Changed on: {new Date(changedAt).toLocaleString()}
                  </Text>
                </Column>
              </Row>

              <Row className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <Column>
                  <Text className="m-0 text-sm text-blue-800">
                    <strong>ℹ️ Next steps:</strong> If you did not make this
                    change, please contact our support team immediately to
                    secure your account.
                  </Text>
                </Column>
              </Row>

              {/* CTA */}
              <Row className="mt-8">
                <Column align="center">
                  <Button
                    href="https://embrly.ca/contact"
                    className="rounded-lg bg-orange-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    Contact Support
                  </Button>
                </Column>
              </Row>
            </Section>

            {/* Footer */}
            <Section className="mt-12">
              <Hr className="border border-gray-200" />
              <Row className="mt-8">
                <Column align="center">
                  <Text className="m-0 text-xs text-gray-500">
                    © {new Date().getFullYear()} NodeByte LTD. All rights
                    reserved.
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
