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
  Hr,
  Preview,
} from '@react-email/components'
import { Tailwind } from '@react-email/tailwind'

interface AccountDeletedEmailProps {
  deletedAt: string
  reason?: string
}

export function AccountDeletedEmail({
  deletedAt,
  reason,
}: AccountDeletedEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Your Emberly account has been deleted</Preview>
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
            <Section className="mb-6 border-l-4 border-gray-500 rounded-lg bg-gray-50 p-4">
              <Text className="m-0 text-sm font-semibold text-gray-800">
                Account Deleted
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Your account has been deleted
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                    Your Emberly account has been permanently deleted. All
                    associated data, files, and settings have been removed from
                    our servers.
                  </Text>
                  {reason && (
                    <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                      <strong>Reason:</strong> {reason}
                    </Text>
                  )}
                  <Text className="m-0 mb-6 text-sm text-gray-600">
                    <strong>Deleted:</strong>{' '}
                    {new Date(deletedAt).toLocaleString()}
                  </Text>
                </Column>
              </Row>

              <Row className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <Column>
                  <Text className="m-0 text-sm text-gray-800">
                    <strong>ℹ️ What happens next:</strong> Your account and all
                    associated data cannot be recovered. If you have any
                    questions, feel free to contact our support team.
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
