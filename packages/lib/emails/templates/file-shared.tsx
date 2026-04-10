import React from 'react'
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import { Tailwind } from '@react-email/tailwind'

interface FileSharedEmailProps {
  recipientName?: string
  ownerName: string
  fileName: string
  fileUrl: string
  role: 'EDITOR' | 'SUGGESTER'
  dashboardUrl?: string
}

export function FileSharedEmail({
  recipientName,
  ownerName,
  fileName,
  fileUrl,
  role,
  dashboardUrl = 'https://embrly.ca/dashboard/files',
}: FileSharedEmailProps) {
  const roleLabel = role === 'EDITOR' ? 'edit' : 'suggest changes to'

  return (
    <Html>
      <Head>
        <Preview>
          {ownerName} shared a file with you: {fileName}
        </Preview>
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

            {/* Main card */}
            <Section className="rounded-lg border border-gray-200 bg-gray-50 p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-2 text-2xl font-bold text-gray-900">
                    📄 File shared with you
                  </Text>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-600">
                    {recipientName ? `Hi ${recipientName}, ` : ''}
                    <strong>{ownerName}</strong> has shared a file with you and
                    given you permission to {roleLabel} it.
                  </Text>

                  <Section className="mb-6 rounded-md border border-gray-200 bg-white p-4">
                    <Text className="m-0 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      File
                    </Text>
                    <Text className="m-0 mt-1 text-lg font-semibold text-gray-900 break-all">
                      {fileName}
                    </Text>
                    <Text className="m-0 mt-1 text-sm text-gray-500">
                      Your access level: <strong>{role === 'EDITOR' ? 'Editor' : 'Suggester'}</strong>
                    </Text>
                  </Section>

                  <Button
                    href={fileUrl}
                    className="block w-full rounded-md bg-orange-600 px-6 py-3 text-center text-sm font-semibold text-white"
                  >
                    View File
                  </Button>
                </Column>
              </Row>
            </Section>

            <Hr className="my-6 border-gray-200" />

            {/* Footer */}
            <Section>
              <Text className="m-0 text-center text-sm text-gray-500">
                You can also find this file in{' '}
                <Link href={dashboardUrl} className="text-orange-600 underline">
                  your shared files dashboard
                </Link>
                .
              </Text>
              <Text className="m-0 mt-4 text-center text-xs text-gray-400">
                © {new Date().getFullYear()} Emberly · All rights reserved
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
