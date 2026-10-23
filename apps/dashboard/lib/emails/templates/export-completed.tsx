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

interface ExportCompletedEmailProps {
  downloadUrl: string
  expiresAt?: string
  exportId: string
}

export function ExportCompletedEmail({
  downloadUrl,
  expiresAt,
  exportId,
}: ExportCompletedEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Your Emberly data export is ready to download</Preview>
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
                ✓ Export Ready
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Your data export is ready
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    Your Emberly data export has been completed and is ready to
                    download.
                  </Text>
                </Column>
              </Row>

              {/* CTA Button */}
              <Row>
                <Column align="center">
                  <Button
                    href={downloadUrl}
                    className="rounded-lg bg-green-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    Download Your Data
                  </Button>
                </Column>
              </Row>

              {/* Expiry warning */}
              {expiresAt && (
                <Row className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <Column align="center">
                    <Text className="m-0 text-sm text-yellow-800">
                      <strong>⏰ Download expires:</strong>{' '}
                      {new Date(expiresAt).toLocaleString()}
                    </Text>
                  </Column>
                </Row>
              )}

              <Row>
                <Column>
                  <Text className="m-0 mt-6 text-sm text-gray-600">
                    <strong>Export ID:</strong> {exportId}
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
