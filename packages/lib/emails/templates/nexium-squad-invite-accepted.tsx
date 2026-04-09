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

interface NexiumSquadInviteAcceptedEmailProps {
  ownerName?: string
  memberName: string
  squadName: string
  squadUrl: string
}

export function NexiumSquadInviteAcceptedEmail({
  ownerName = 'there',
  memberName,
  squadName,
  squadUrl,
}: NexiumSquadInviteAcceptedEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>{memberName} accepted your invite to join {squadName}</Preview>
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
            <Section className="mb-6 border-l-4 border-green-500 rounded-lg bg-green-50 p-4">
              <Text className="m-0 text-sm font-semibold text-green-800">
                ✅ Invite Accepted
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Great news, {ownerName}!
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    <strong>{memberName}</strong> has accepted your invitation and is now a member of{' '}
                    <strong>{squadName}</strong>.
                  </Text>
                </Column>
              </Row>

              {/* Squad info */}
              <Row className="mb-8 rounded-lg bg-green-50 p-4 border border-green-200">
                <Column>
                  <Text className="m-0 mb-1 text-sm font-semibold text-green-900">New Member</Text>
                  <Text className="m-0 text-lg font-bold text-green-800">{memberName}</Text>
                  <Text className="m-0 mt-1 text-sm text-green-700">Joined {squadName}</Text>
                </Column>
              </Row>

              {/* CTA */}
              <Row className="mt-4">
                <Column align="center">
                  <Button
                    href={squadUrl}
                    className="rounded-lg bg-purple-600 px-8 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    View Squad
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
