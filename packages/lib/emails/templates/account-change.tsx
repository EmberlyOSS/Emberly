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

interface AccountChangeEmailProps {
  userName?: string
  changes: string[]
  manageUrl?: string
  supportUrl?: string
}

export function AccountChangeEmail({
  userName,
  changes,
  manageUrl = 'https://embrly.ca/me',
  supportUrl = 'https://embrly.ca/contact',
}: AccountChangeEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Your Emberly account has been modified</Preview>
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
                ℹ️ Account Change Notice
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Account modification
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    {userName ? `Hi ${userName},` : ''} Your Emberly account has been modified. Here are the details:
                  </Text>
                </Column>
              </Row>

              {/* Changes List */}
              <Section className="mb-6 rounded-lg bg-gray-50 p-4 border border-gray-200">
                {changes.map((change, idx) => (
                  <Row key={idx} className="mb-2">
                    <Column className="w-6">
                      <Text className="m-0 text-gray-700">•</Text>
                    </Column>
                    <Column>
                      <Text className="m-0 text-sm text-gray-600">
                        {change}
                      </Text>
                    </Column>
                  </Row>
                ))}
              </Section>

              {/* CTA Button */}
              <Row>
                <Column align="center">
                  <Button
                    href={manageUrl}
                    className="rounded-lg bg-orange-600 px-8 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    Manage Account
                  </Button>
                </Column>
              </Row>

              {/* Security info */}
              <Row className="mt-6">
                <Column className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <Text className="m-0 text-sm text-blue-900">
                    <strong>Didn't make this change?</strong> If you didn't authorize this modification, please{' '}
                    <Link
                      href={supportUrl}
                      className="text-blue-700 font-semibold no-underline"
                    >
                      contact support
                    </Link>{' '}
                    immediately.
                  </Text>
                </Column>
              </Row>

              {/* Footer note */}
              <Row className="mt-4">
                <Column>
                  <Text className="m-0 text-xs text-gray-600">
                    <strong>Why are you receiving this?</strong> We send notifications when important account changes are made to help keep your account secure.
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Bottom Footer */}
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
