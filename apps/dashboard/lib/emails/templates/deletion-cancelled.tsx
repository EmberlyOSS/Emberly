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

interface DeletionCancelledEmailProps {
  cancelledAt: string
}

export function DeletionCancelledEmail({
  cancelledAt,
}: DeletionCancelledEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Your Emberly account deletion has been cancelled</Preview>
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
                ✓ Deletion Cancelled
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Account deletion cancelled
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    Your Emberly account has been successfully recovered. Your
                    account deletion request has been cancelled and your account
                    is now active again.
                  </Text>
                  <Text className="m-0 mb-4 text-sm text-gray-600">
                    <strong>Cancelled:</strong>{' '}
                    {new Date(cancelledAt).toLocaleString()}
                  </Text>
                </Column>
              </Row>

              <Row className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200">
                <Column>
                  <Text className="m-0 text-sm text-green-800">
                    <strong>✓ Your account is confirmed active.</strong> All
                    your files and settings have been preserved.
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
