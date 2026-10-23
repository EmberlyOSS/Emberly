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

export interface BucketCredentialsEmailProps {
  recipientName?: string
  /** Human-readable bucket label set by admin */
  bucketName: string
  /** S3 bucket name */
  s3Bucket: string
  /** AWS region (e.g. us-east-1) */
  s3Region: string
  /** Access key ID */
  s3AccessKeyId: string
  /** Link to the dashboard bucket page */
  dashboardUrl?: string
}

export function BucketCredentialsEmail({
  recipientName,
  bucketName,
  s3Bucket,
  s3Region,
  s3AccessKeyId,
  dashboardUrl = 'https://embrly.ca/dashboard/bucket',
}: BucketCredentialsEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>Your storage bucket is ready — credentials enclosed</Preview>
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
                🪣 Your Storage Bucket is Ready
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    {recipientName
                      ? `${recipientName}, your bucket is live!`
                      : 'Your bucket is live!'}
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    We&apos;ve configured your dedicated storage bucket{' '}
                    <strong>{bucketName}</strong>. Use the credentials below to
                    connect your S3-compatible client.
                  </Text>
                </Column>
              </Row>

              {/* Credentials box */}
              <Section className="mb-6 rounded-lg bg-gray-900 p-6">
                <Text className="m-0 mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  S3 Credentials
                </Text>

                {[
                  { label: 'Bucket Name', value: s3Bucket },
                  { label: 'Region', value: s3Region },
                  { label: 'Access Key ID', value: s3AccessKeyId },
                ].map(({ label, value }) => (
                  <Row key={label} className="mb-3">
                    <Column>
                      <Text className="m-0 text-xs text-gray-400">{label}</Text>
                      <Text className="m-0 mt-1 rounded bg-gray-800 px-3 py-1.5 font-mono text-sm text-green-400">
                        {value}
                      </Text>
                    </Column>
                  </Row>
                ))}

                <Hr className="my-4 border-gray-700" />
                <Text className="m-0 text-xs text-amber-400">
                  ⚠️ Your Secret Access Key was set by Emberly and is not shown
                  here for security. If you need it, please contact support.
                </Text>
              </Section>

              {/* Security notice */}
              <Section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <Text className="m-0 text-sm font-semibold text-amber-800 mb-2">
                  Security reminder
                </Text>
                <Text className="m-0 text-sm text-amber-700">
                  Never share your access credentials publicly. Store them
                  securely in environment variables or a secrets manager.
                  Contact support immediately if you suspect unauthorized
                  access.
                </Text>
              </Section>

              {/* CTA */}
              <Row>
                <Column align="center">
                  <Button
                    href={dashboardUrl}
                    className="inline-block rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white no-underline"
                  >
                    View Bucket Dashboard
                  </Button>
                </Column>
              </Row>
            </Section>

            <Hr className="my-8 border-gray-200" />

            {/* Footer */}
            <Section>
              <Row>
                <Column align="center">
                  <Text className="m-0 text-xs text-gray-400">
                    © {new Date().getFullYear()} NodeByte LTD. All rights
                    reserved.
                  </Text>
                  <Text className="m-0 mt-1 text-xs text-gray-400">
                    Questions? Contact us at{' '}
                    <Link
                      href="mailto:support@embrly.ca"
                      className="text-orange-600"
                    >
                      support@embrly.ca
                    </Link>
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
