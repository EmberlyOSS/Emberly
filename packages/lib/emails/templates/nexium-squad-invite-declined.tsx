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

interface NexiumSquadInviteDeclinedEmailProps {
  ownerName?: string
  memberName: string
  squadName: string
}

export function NexiumSquadInviteDeclinedEmail({
  ownerName = 'there',
  memberName,
  squadName,
}: NexiumSquadInviteDeclinedEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>{memberName} declined your invite to join {squadName}</Preview>
      </Head>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-2xl px-4 py-8">
            {/* Header */}
            <Section className="mb-8">
              <Row>
                <Column align="left">
                  <Link href="https://embrly.ca" className="inline-block">
                    <Text className="m-0 text-xl font-bold text-orange-600">Emberly</Text>
                  </Link>
                </Column>
              </Row>
            </Section>

            {/* Alert Banner */}
            <Section className="mb-6 border-l-4 border-gray-400 rounded-lg bg-gray-50 p-4">
              <Text className="m-0 text-sm font-semibold text-gray-700">
                ℹ️ Invite Declined
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Hey {ownerName},
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    <strong>{memberName}</strong> has declined your invitation to join{' '}
                    <strong>{squadName}</strong>. No action is required on your end — you can always invite someone else.
                  </Text>
                </Column>
              </Row>

              {/* Info */}
              <Row className="mt-2">
                <Column className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <Text className="m-0 text-sm text-blue-900">
                    You can invite other users from your squad's Members tab on the{' '}
                    <Link href="https://embrly.ca/dashboard/discovery" className="text-blue-700 underline">
                      Discovery dashboard
                    </Link>.
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
                  <Text className="m-0 mt-1 text-xs text-gray-400">
                    <Link href="https://embrly.ca" className="text-gray-400 underline">
                      embrly.ca
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
