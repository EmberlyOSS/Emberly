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

interface ExportRequestedEmailProps {
  exportId: string
  requestedAt: string
}

export function ExportRequestedEmail({
  exportId,
  requestedAt,
}: ExportRequestedEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Your Emberly data export is being prepared</Preview>
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
                📦 Data Export Requested
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Your data export is being prepared
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-base leading-relaxed text-gray-700">
                    We've received your request to export your Emberly data.
                    We're preparing your files now and will send you a download
                    link as soon as it's ready.
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-2 text-sm text-gray-600">
                    <strong>Export ID:</strong> {exportId}
                  </Text>
                  <Text className="m-0 mb-6 text-sm text-gray-600">
                    <strong>Requested:</strong>{' '}
                    {new Date(requestedAt).toLocaleString()}
                  </Text>
                </Column>
              </Row>

              <Row className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <Column>
                  <Text className="m-0 text-sm text-blue-800">
                    <strong>ℹ️ What happens next:</strong> Depending on the size
                    of your data, the export may take several minutes to
                    complete. We'll email you as soon as your data is ready to
                    download.
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
