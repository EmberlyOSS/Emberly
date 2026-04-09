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

interface NexiumSquadInviteEmailProps {
  name?: string
  squadName: string
  inviterName: string
  inviteUrl: string
  declineUrl: string
}

export function NexiumSquadInviteEmail({
  name = 'there',
  squadName,
  inviterName,
  inviteUrl,
  declineUrl,
}: NexiumSquadInviteEmailProps) {
  return (
    <Html>
      <Head>
        <Preview>You've been invited to join {squadName} on Nexium</Preview>
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
            <Section className="mb-6 border-l-4 border-purple-500 rounded-lg bg-purple-50 p-4">
              <Text className="m-0 text-sm font-semibold text-purple-800">
                👥 Squad Invitation
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    You're invited, {name}!
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-2 text-base leading-relaxed text-gray-700">
                    <strong>{inviterName}</strong> has invited you to join the{' '}
                    <strong>{squadName}</strong> squad on Nexium.
                  </Text>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    Squads let you collaborate with like-minded builders, share opportunities, and grow together as a team.
                  </Text>
                </Column>
              </Row>

              {/* Squad info */}
              <Row className="mb-6 rounded-lg bg-purple-50 p-4 border border-purple-200">
                <Column>
                  <Text className="m-0 mb-1 text-sm font-semibold text-purple-900">
                    Squad
                  </Text>
                  <Text className="m-0 text-lg font-bold text-purple-800">
                    {squadName}
                  </Text>
                  <Text className="m-0 mt-1 text-sm text-purple-700">
                    Invited by {inviterName}
                  </Text>
                </Column>
              </Row>

              {/* Benefits */}
              <Row>
                <Column>
                  <Text className="m-0 mb-3 font-semibold text-gray-900">
                    As a squad member you can:
                  </Text>
                </Column>
              </Row>

              {[
                { icon: '🤝', desc: 'Build alongside teammates who share your interests' },
                { icon: '📣', desc: 'Stay in the loop on squad opportunities and announcements' },
                { icon: '🏆', desc: 'Gain squad recognition and boost your Nexium presence' },
              ].map((benefit, idx) => (
                <Row key={idx} className="mb-2">
                  <Column className="w-8">
                    <Text className="m-0 text-lg">{benefit.icon}</Text>
                  </Column>
                  <Column className="flex-1">
                    <Text className="m-0 text-gray-700">
                      {benefit.desc}
                    </Text>
                  </Column>
                </Row>
              ))}

              {/* CTA Button */}
              <Row className="mt-8">
                <Column align="center">
                  <Button
                    href={inviteUrl}
                    className="rounded-lg bg-purple-600 px-8 py-3 text-center text-base font-semibold text-white no-underline"
                  >
                    Accept Invite
                  </Button>
                </Column>
              </Row>

              {/* Decline link */}
              <Row className="mt-4">
                <Column align="center">
                  <Text className="m-0 text-xs text-gray-500">
                    Not interested?{' '}
                    <Link href={declineUrl} className="text-gray-500 underline">
                      Decline this invitation
                    </Link>
                  </Text>
                </Column>
              </Row>

              {/* Expiry / security note */}
              <Row className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <Column align="center">
                  <Text className="m-0 text-sm text-yellow-800">
                    <strong>⏰ This invite expires in 7 days</strong> – accept it soon to secure your spot.
                  </Text>
                </Column>
              </Row>

              {/* Security info */}
              <Row className="mt-4">
                <Column className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <Text className="m-0 text-sm text-blue-900">
                    <strong>Not expecting this?</strong> If you don't know {inviterName} or weren't expecting an invite, you can safely ignore this email.
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
