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

export interface ApplicationReplyEmailProps {
  /** Name of the person receiving the email */
  recipientName?: string
  /** The content of the reply */
  replyContent: string
  /** Name of the sender (staff member or applicant) */
  senderName?: string
  /** Whether this reply is from a staff member */
  isStaffReply: boolean
  /** The type of application (e.g. "Staff", "Partner") */
  applicationType?: string
  /** Direct link to the application */
  applicationUrl?: string
}

export function ApplicationReplyEmail({
  recipientName,
  replyContent,
  senderName,
  isStaffReply,
  applicationType = 'Application',
  applicationUrl = 'https://embrly.ca/dashboard',
}: ApplicationReplyEmailProps) {
  const subject = isStaffReply
    ? `New reply on your ${applicationType} application`
    : `New applicant reply — ${applicationType} application`

  const preheader = isStaffReply
    ? `The Emberly team has replied to your ${applicationType} application.`
    : `An applicant has replied to their ${applicationType} application.`

  return (
    <Html>
      <Head>
        <Preview>{preheader}</Preview>
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
            <Section className="mb-6 border-l-4 border-orange-500 rounded-lg bg-orange-50 p-4">
              <Text className="m-0 text-sm font-semibold text-orange-800">
                💬 New Application Reply
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    {isStaffReply
                      ? `Emberly has replied to your application`
                      : `New reply on ${applicationType} application`}
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    {recipientName ? `Hi ${recipientName}, ` : ''}
                    {isStaffReply
                      ? `The Emberly team has left a reply on your ${applicationType} application.`
                      : `An applicant has replied to their ${applicationType} application.`}
                  </Text>
                </Column>
              </Row>

              {/* Reply content box */}
              <Section className="mb-6 rounded-lg bg-gray-50 p-6 border border-gray-200">
                <Row>
                  <Column>
                    <Text className="m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {senderName
                        ? `Reply from ${senderName}`
                        : isStaffReply
                          ? 'Reply from Emberly Staff'
                          : 'Reply from Applicant'}
                    </Text>
                    <Hr className="my-2 border-gray-200" />
                    <Text className="m-0 text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
                      {replyContent}
                    </Text>
                  </Column>
                </Row>
              </Section>

              {/* CTA */}
              <Row>
                <Column align="center">
                  <Button
                    href={applicationUrl}
                    className="inline-block rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white no-underline"
                  >
                    View Application
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
                    You received this email because of activity on your Emberly
                    application.
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
