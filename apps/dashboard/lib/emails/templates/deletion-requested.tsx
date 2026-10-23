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

interface DeletionRequestedEmailProps {
  scheduledAt: string
  cancelUrl: string
}

export function DeletionRequestedEmail({
  scheduledAt,
  cancelUrl,
}: DeletionRequestedEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Your Emberly account is scheduled for deletion</Preview>
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
            <Section className="mb-6 border-l-4 border-red-500 rounded-lg bg-red-50 p-4">
              <Text className="m-0 text-sm font-semibold text-red-800">
                ⚠️ Account Deletion Scheduled
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Your account is scheduled for deletion
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                    Your Emberly account is scheduled to be permanently deleted.
                  </Text>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    <strong>Deletion date:</strong>{' '}
                    {new Date(scheduledAt).toLocaleString()}
                  </Text>
                </Column>
              </Row>

              <Row className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <Column>
                  <Text className="m-0 text-sm text-blue-800">
                    <strong>ℹ️ Before deletion:</strong> All your files,
                    settings, and account data will be permanently removed. This
                    action cannot be undone.
                  </Text>
                </Column>
              </Row>

              {/* CTA */}
              <Row className="mt-8">
                <Column align="center">
                  <Button
                    href={cancelUrl}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    Cancel Deletion
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
