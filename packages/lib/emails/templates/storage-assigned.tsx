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

interface StorageAssignedEmailProps {
  storageAmount: string
  reason?: string
  usageUrl?: string
}

export function StorageAssignedEmail({
  storageAmount,
  reason = 'as part of your subscription',
  usageUrl = 'https://emberly.dev/dashboard/uploads',
}: StorageAssignedEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>You've been assigned additional storage</Preview>
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

            {/* Alert Banner */}
            <Section className="mb-6 border-l-4 border-green-500 rounded-lg bg-green-50 p-4">
              <Text className="m-0 text-sm font-semibold text-green-800">
                ✨ Storage Added
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Additional storage assigned
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    Great news! You've been assigned{' '}
                    <strong className="text-green-700">{storageAmount}</strong> of
                    additional storage {reason}.
                  </Text>
                </Column>
              </Row>

              {/* Storage highlight */}
              <Section className="mb-6 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 p-6 border border-green-200">
                <Row>
                  <Column align="center">
                    <Text className="m-0 text-4xl font-bold text-green-600">
                      {storageAmount}
                    </Text>
                  </Column>
                </Row>
                <Row>
                  <Column align="center">
                    <Text className="m-0 text-sm text-gray-600 mt-2">
                      Now available in your account
                    </Text>
                  </Column>
                </Row>
              </Section>

              {/* What you can do */}
              <Row className="mb-6">
                <Column>
                  <Text className="m-0 text-sm font-semibold text-gray-900 mb-3">
                    What you can do now:
                  </Text>
                  <Text className="m-0 text-sm text-gray-700 mb-2">
                    • Upload and store more files
                  </Text>
                  <Text className="m-0 text-sm text-gray-700 mb-2">
                    • Share larger files with others
                  </Text>
                  <Text className="m-0 text-sm text-gray-700">
                    • Keep all your important documents backed up
                  </Text>
                </Column>
              </Row>

              {/* CTA Button */}
              <Row>
                <Column align="center">
                  <Button
                    href={usageUrl}
                    className="rounded-lg bg-orange-600 px-8 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    View Storage Usage
                  </Button>
                </Column>
              </Row>

              {/* Info box */}
              <Row className="mt-6">
                <Column className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <Text className="m-0 text-sm font-semibold text-blue-900 mb-2">
                    📊 Storage Tips:
                  </Text>
                  <Text className="m-0 text-sm text-blue-900">
                    • Keep track of your storage usage to avoid running out of space
                  </Text>
                  <Text className="m-0 text-sm text-blue-900">
                    • Delete files you no longer need to free up space
                  </Text>
                  <Text className="m-0 text-sm text-blue-900">
                    • Contact support if you need additional storage
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
