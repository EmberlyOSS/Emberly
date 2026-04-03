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

interface NexiumOpportunityEmailProps {
  name?: string
  opportunityTitle: string
  opportunityUrl: string
  companyName?: string
  skills: string[]
}

export function NexiumOpportunityEmail({
  name = 'there',
  opportunityTitle,
  opportunityUrl,
  companyName,
  skills = [],
}: NexiumOpportunityEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>New opportunity matched your Nexium profile: {opportunityTitle}</Preview>
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

            {/* Main content */}
            <Section className="border border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-white p-8 text-center">
              <Row>
                <Column align="center">
                  <Text className="m-0 mb-4 text-5xl">
                    💼
                  </Text>
                  <Text className="m-0 mb-2 text-sm font-semibold text-blue-700 uppercase tracking-wide">
                    Opportunity Match
                  </Text>
                  <Text className="m-0 mb-2 text-3xl font-bold text-gray-900">
                    {opportunityTitle}
                  </Text>
                  {companyName && (
                    <Text className="m-0 mb-4 text-base text-gray-600">
                      at <strong>{companyName}</strong>
                    </Text>
                  )}
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    Hi {name}! A new opportunity has been matched to your Nexium profile based on your skills and experience.
                  </Text>
                </Column>
              </Row>

              {/* Matched skills */}
              {skills.length > 0 && (
                <>
                  <Row className="mb-3">
                    <Column align="center">
                      <Text className="m-0 font-semibold text-gray-900">
                        Matched skills:
                      </Text>
                    </Column>
                  </Row>
                  <Row className="mb-6 rounded-lg bg-blue-50 p-4 border border-blue-200">
                    <Column align="center">
                      <Text className="m-0 text-sm text-blue-800">
                        {skills.join(' · ')}
                      </Text>
                    </Column>
                  </Row>
                </>
              )}

              {/* What to expect */}
              <Row>
                <Column>
                  <Text className="m-0 mb-3 font-semibold text-gray-900">
                    What this involves:
                  </Text>
                </Column>
              </Row>

              {[
                { icon: '🔍', desc: 'Review the full opportunity details and requirements' },
                { icon: '📬', desc: 'Express your interest directly from your Nexium profile' },
                { icon: '🤝', desc: 'Connect with the team if it\'s the right fit for you' },
              ].map((step, idx) => (
                <Row key={idx} className="mb-2">
                  <Column className="w-8">
                    <Text className="m-0 text-lg">{step.icon}</Text>
                  </Column>
                  <Column className="flex-1 text-left">
                    <Text className="m-0 text-gray-700">
                      {step.desc}
                    </Text>
                  </Column>
                </Row>
              ))}

              {/* CTA */}
              <Row className="mt-8">
                <Column align="center">
                  <Button
                    href={opportunityUrl}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    View Opportunity
                  </Button>
                </Column>
              </Row>

              <Row className="mt-4">
                <Column align="center">
                  <Text className="m-0 text-sm text-gray-600">
                    Not interested?{' '}
                    <Link
                      href="https://embrly.ca/nexium/settings"
                      className="text-blue-600 font-semibold no-underline"
                    >
                      Update your preferences
                    </Link>
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
