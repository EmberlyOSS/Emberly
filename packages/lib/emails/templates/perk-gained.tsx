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

interface PerkGainedEmailProps {
  perkName: string
  perkDescription?: string
  perkIcon?: string
  expiresAt?: string | null
  viewUrl?: string
}

export function PerkGainedEmail({
  perkName,
  perkDescription,
  perkIcon = '🎉',
  expiresAt,
  viewUrl = 'https://embrly.ca/me',
}: PerkGainedEmailProps) {
  const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : null

  return (
    <Html>
      <Head>
        <Preview>You've unlocked a new perk: {perkName}</Preview>
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

            {/* Celebration content */}
            <Section className="border border-green-200 rounded-lg bg-gradient-to-br from-green-50 to-white p-8 text-center">
              <Row>
                <Column align="center">
                  <Text className="m-0 mb-4 text-5xl">
                    {perkIcon}
                  </Text>
                  <Text className="m-0 mb-2 text-sm font-semibold text-green-700 uppercase tracking-wide">
                    Perk Unlocked
                  </Text>
                  <Text className="m-0 mb-4 text-3xl font-bold text-gray-900">
                    {perkName}
                  </Text>
                </Column>
              </Row>

              {perkDescription && (
                <Row>
                  <Column>
                    <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                      {perkDescription}
                    </Text>
                  </Column>
                </Row>
              )}

              {/* Expiry info if applicable */}
              {expiryDate && (
                <Row className="mb-6 rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                  <Column align="center">
                    <Text className="m-0 text-sm text-yellow-800">
                      <span className="font-semibold">⏰ Expires on {expiryDate}</span>
                    </Text>
                  </Column>
                </Row>
              )}

              {!expiryDate && (
                <Row className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
                  <Column align="center">
                    <Text className="m-0 text-sm text-green-800">
                      <span className="font-semibold">✨ This perk is permanent!</span>
                    </Text>
                  </Column>
                </Row>
              )}

              {/* Benefits section */}
              <Row>
                <Column>
                  <Text className="m-0 mb-3 font-semibold text-gray-900">
                    What this unlocks:
                  </Text>
                </Column>
              </Row>

              {[
                'Exclusive features and priority support',
                'Special recognition in the community',
                'Access to beta features and early access',
              ].map((benefit, idx) => (
                <Row key={idx} className="mb-2">
                  <Column className="w-8">
                    <Text className="m-0 text-lg">✨</Text>
                  </Column>
                  <Column className="flex-1">
                    <Text className="m-0 text-gray-700">
                      {benefit}
                    </Text>
                  </Column>
                </Row>
              ))}

              {/* CTA */}
              <Row className="mt-8">
                <Column align="center">
                  <Button
                    href={viewUrl}
                    className="rounded-lg bg-green-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    View Your Perks
                  </Button>
                </Column>
              </Row>

              <Row className="mt-4">
                <Column align="center">
                  <Text className="m-0 text-sm text-gray-600">
                    Thank you for being part of the Emberly community! 🚀
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
