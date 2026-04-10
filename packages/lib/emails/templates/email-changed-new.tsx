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

interface EmailChangedNewEmailProps {
  oldEmail: string
  newEmail: string
  changedAt: string
}

export function EmailChangedNewEmail({
  oldEmail,
  newEmail,
  changedAt,
}: EmailChangedNewEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Welcome to your new Emberly email</Preview>
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
            <Section className="mb-6 border-l-4 border-green-500 rounded-lg bg-green-50 p-4">
              <Text className="m-0 text-sm font-semibold text-green-800">
                ✓ Email Updated
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Welcome to your new email
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                    Your Emberly account email has been successfully updated to this address ({newEmail}).
                  </Text>
                  <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                    You'll receive all future account emails at this new address.
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-sm text-gray-600">
                    <strong>Previous email:</strong> {oldEmail}
                  </Text>
                  <Text className="m-0 mb-6 text-sm text-gray-600">
                    Changed on: {new Date(changedAt).toLocaleString()}
                  </Text>
                </Column>
              </Row>

              {/* CTA */}
              <Row className="mt-8">
                <Column align="center">
                  <Button
                    href="https://embrly.ca/me"
                    className="rounded-lg bg-orange-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    Go to Dashboard
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
