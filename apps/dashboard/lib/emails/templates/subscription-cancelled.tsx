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

interface SubscriptionCancelledEmailProps {
  effectiveAt: string
  reason?: string
}

export function SubscriptionCancelledEmail({
  effectiveAt,
  reason,
}: SubscriptionCancelledEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Your Emberly subscription has been cancelled</Preview>
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
                ⚠️ Subscription Cancelled
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Your subscription has been cancelled
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                    Your Emberly subscription has been cancelled. Your account
                    will revert to the free plan after the cancellation date.
                  </Text>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    <strong>Effective date:</strong>{' '}
                    {new Date(effectiveAt).toLocaleString()}
                  </Text>
                  {reason && (
                    <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                      <strong>Cancellation reason:</strong> {reason}
                    </Text>
                  )}
                </Column>
              </Row>

              <Row className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <Column>
                  <Text className="m-0 text-sm text-yellow-800">
                    <strong>ℹ️ What happens next:</strong> You can reactivate
                    your subscription at any time by visiting your billing
                    settings.
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
