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

interface SubscriptionUpdatedEmailProps {
  changeType: 'upgrade' | 'downgrade' | 'update'
  newPlanName: string
}

export function SubscriptionUpdatedEmail({
  changeType,
  newPlanName,
}: SubscriptionUpdatedEmailProps) {
  const changeLabel =
    changeType === 'upgrade'
      ? 'upgraded'
      : changeType === 'downgrade'
        ? 'downgraded'
        : 'updated'

  return (
    <Html>
      <Head>
        <Preview>Your Emberly subscription has been {changeLabel}</Preview>
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
            <Section className="mb-6 border-l-4 border-blue-500 rounded-lg bg-blue-50 p-4">
              <Text className="m-0 text-sm font-semibold text-blue-800">
                ℹ️ Subscription{' '}
                {changeLabel.charAt(0).toUpperCase() + changeLabel.slice(1)}
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Your subscription has been {changeLabel}
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    Your Emberly subscription has been successfully{' '}
                    {changeLabel} to the <strong>{newPlanName}</strong> plan.
                    Your changes take effect immediately.
                  </Text>
                </Column>
              </Row>

              <Row className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <Column>
                  <Text className="m-0 text-sm text-blue-800">
                    <strong>ℹ️ Next steps:</strong> Your new plan features are
                    now active. Visit your dashboard to review your updated
                    benefits and settings.
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
