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

interface QuotaReachedEmailProps {
  currentUsage: number
  quotaLimit: number
  percentage: number
  unit?: string
  dashboardUrl?: string
}

export function QuotaReachedEmail({
  currentUsage,
  quotaLimit,
  percentage,
  unit = 'GB',
  dashboardUrl = 'https://emberly.dev/dashboard',
}: QuotaReachedEmailProps) {
  const percentageBar = Math.round(percentage / 5) // 20 segments for visual bar
  const filledSegments = Math.round(percentageBar)

  return (
    <Html>
      <Head>
        <Preview>You're using {percentage.toFixed(0)}% of your storage quota</Preview>
      </Head>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-2xl px-4 py-8">
            {/* Header */}
            <Section className="mb-8">
              <Row>
                <Column align="left">
                  <Link href="https://emberly.dev" className="inline-block">
                    <Text className="m-0 text-xl font-bold text-orange-600">
                      Emberly
                    </Text>
                  </Link>
                </Column>
              </Row>
            </Section>

            {/* Alert content */}
            <Section className="border-l-4 border-orange-500 rounded-lg bg-orange-50 p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-2 text-sm font-semibold text-orange-700 uppercase tracking-wide">
                    ⚠️ Storage Alert
                  </Text>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    You're running low on storage
                  </Text>
                </Column>
              </Row>

              <Row className="mb-6">
                <Column>
                  <Text className="m-0 mb-4 text-base text-gray-700">
                    Your storage quota is now {percentage.toFixed(1)}% full. Here's a breakdown:
                  </Text>
                </Column>
              </Row>

              {/* Storage stats */}
              <Row className="mb-6 rounded-lg bg-white p-4 border border-orange-200">
                <Column>
                  <Row className="mb-3">
                    <Column className="w-1/3">
                      <Text className="m-0 text-sm text-gray-600">Used</Text>
                      <Text className="m-0 text-lg font-bold text-gray-900">
                        {currentUsage.toFixed(1)} {unit}
                      </Text>
                    </Column>
                    <Column className="w-1/3">
                      <Text className="m-0 text-sm text-gray-600">Available</Text>
                      <Text className="m-0 text-lg font-bold text-gray-900">
                        {quotaLimit.toFixed(1)} {unit}
                      </Text>
                    </Column>
                    <Column className="w-1/3 text-right">
                      <Text className="m-0 text-sm text-gray-600">Usage</Text>
                      <Text className="m-0 text-lg font-bold text-orange-600">
                        {percentage.toFixed(1)}%
                      </Text>
                    </Column>
                  </Row>

                  {/* Visual progress bar */}
                  <Row className="mt-4">
                    <Column>
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            height: '100%',
                            backgroundColor: percentage > 90 ? '#ef4444' : '#f97316',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </Column>
                  </Row>
                </Column>
              </Row>

              {/* Options */}
              <Row>
                <Column>
                  <Text className="m-0 mb-3 font-semibold text-gray-900">
                    What you can do:
                  </Text>
                </Column>
              </Row>

              {[
                { icon: '🗑️', title: 'Delete old files', desc: 'Remove files you no longer need' },
                { icon: '📦', title: 'Upgrade your plan', desc: 'Get more storage with a paid plan' },
                { icon: '🤝', title: 'Contact support', desc: 'Request a manual increase' },
              ].map((option, idx) => (
                <Row key={idx} className="mb-2">
                  <Column className="w-8">
                    <Text className="m-0 text-lg">{option.icon}</Text>
                  </Column>
                  <Column className="flex-1">
                    <Text className="m-0 font-semibold text-gray-900">
                      {option.title}
                    </Text>
                    <Text className="m-0 text-sm text-gray-600">
                      {option.desc}
                    </Text>
                  </Column>
                </Row>
              ))}

              {/* CTA */}
              <Row className="mt-8">
                <Column align="center">
                  <Button
                    href={dashboardUrl}
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
