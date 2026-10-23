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

interface SubscriptionCreatedEmailProps {
  planName: string
  interval: 'day' | 'month' | 'year'
  amount: number
  currency: string
}

export function SubscriptionCreatedEmail({
  planName,
  interval,
  amount,
  currency,
}: SubscriptionCreatedEmailProps) {
  const intervalLabel =
    interval === 'year' ? 'year' : interval === 'month' ? 'month' : 'day'
  const formattedAmount = (amount / 100).toFixed(2)

  return (
    <Html>
      <Head>
        <Preview>Welcome to Emberly {planName}</Preview>
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
                ✓ Subscription Activated
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-2 text-sm font-semibold text-orange-600 uppercase tracking-wide">
                    Welcome
                  </Text>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Welcome to Emberly {planName}
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    Your subscription has been activated! You now have access to
                    all {planName} features.
                  </Text>
                </Column>
              </Row>

              {/* Subscription details */}
              <Row className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <Column>
                  <Text className="m-0 mb-2 text-sm font-semibold text-gray-900">
                    Subscription Details
                  </Text>
                  <Text className="m-0 text-sm text-gray-700">
                    <strong>Plan:</strong> {planName}
                  </Text>
                  <Text className="m-0 text-sm text-gray-700">
                    <strong>Billing:</strong> {formattedAmount} {currency} per{' '}
                    {intervalLabel}
                  </Text>
                </Column>
              </Row>

              {/* CTA */}
              <Row className="mt-8">
                <Column align="center">
                  <Button
                    href="https://embrly.ca/dashboard"
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
