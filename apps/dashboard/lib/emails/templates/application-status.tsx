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

export type ApplicationStatusType =
  | 'received'
  | 'reviewing'
  | 'approved'
  | 'rejected'

export interface ApplicationStatusEmailProps {
  /** Name of the applicant */
  recipientName?: string
  /** The type of application, e.g. "Staff", "Partner" */
  applicationType?: string
  /** Lifecycle status this email represents */
  status: ApplicationStatusType
  /** Optional reviewer notes (shown for approved/rejected) */
  reviewNotes?: string
  /** Link to the applicant's applications page */
  applicationUrl?: string
}

const STATUS_CONFIG: Record<
  ApplicationStatusType,
  {
    bannerEmoji: string
    bannerLabel: string
    bannerClass: string
    headline: (type: string) => string
    body: (name: string | undefined, type: string) => string
    ctaLabel: string
  }
> = {
  received: {
    bannerEmoji: '📬',
    bannerLabel: 'Application Received',
    bannerClass: 'border-l-4 border-blue-500 bg-blue-50',
    headline: (type) => `We've received your ${type} application`,
    body: (name, type) =>
      `${name ? `Hi ${name}, ` : ''}thanks for submitting your ${type} application! Our team will review it shortly and get back to you. You can check the status of your application at any time using the link below.`,
    ctaLabel: 'View My Applications',
  },
  reviewing: {
    bannerEmoji: '🔍',
    bannerLabel: 'Application Under Review',
    bannerClass: 'border-l-4 border-yellow-500 bg-yellow-50',
    headline: (type) => `Your ${type} application is under review`,
    body: (name, type) =>
      `${name ? `Hi ${name}, ` : ''}good news — your ${type} application is now actively being reviewed by our team. We'll notify you once a decision has been made.`,
    ctaLabel: 'View My Applications',
  },
  approved: {
    bannerEmoji: '✅',
    bannerLabel: 'Application Approved',
    bannerClass: 'border-l-4 border-green-500 bg-green-50',
    headline: (type) => `Your ${type} application has been approved!`,
    body: (name, type) =>
      `${name ? `Hi ${name}, ` : ''}great news — your ${type} application has been approved! Welcome aboard. Any associated perks or roles will be applied to your account shortly.`,
    ctaLabel: 'View My Applications',
  },
  rejected: {
    bannerEmoji: '❌',
    bannerLabel: 'Application Not Approved',
    bannerClass: 'border-l-4 border-red-400 bg-red-50',
    headline: (type) => `Your ${type} application was not approved`,
    body: (name, type) =>
      `${name ? `Hi ${name}, ` : ''}thank you for your interest. After reviewing your ${type} application, we've decided not to move forward at this time. You're welcome to apply again in the future.`,
    ctaLabel: 'View My Applications',
  },
}

export function ApplicationStatusEmail({
  recipientName,
  applicationType = 'Application',
  status,
  reviewNotes,
  applicationUrl = 'https://embrly.ca/applications',
}: ApplicationStatusEmailProps) {
  const config = STATUS_CONFIG[status]
  const headline = config.headline(applicationType)
  const bodyText = config.body(recipientName, applicationType)

  const preheader = headline

  return (
    <Html>
      <Head>
        <Preview>{preheader}</Preview>
      </Head>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-2xl px-4 py-8">
            {/* Logo */}
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

            {/* Banner */}
            <Section className={`mb-6 rounded-lg p-4 ${config.bannerClass}`}>
              <Text className="m-0 text-sm font-semibold text-gray-800">
                {config.bannerEmoji} {config.bannerLabel}
              </Text>
            </Section>

            {/* Card */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    {headline}
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    {bodyText}
                  </Text>
                </Column>
              </Row>

              {/* Review notes (approved/rejected) */}
              {reviewNotes && (
                <Section className="mb-6 rounded-lg bg-gray-50 border border-gray-200 p-5">
                  <Row>
                    <Column>
                      <Text className="m-0 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Reviewer Notes
                      </Text>
                      <Hr className="my-2 border-gray-200" />
                      <Text className="m-0 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                        {reviewNotes}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              )}

              {/* CTA */}
              <Row>
                <Column align="center">
                  <Button
                    href={applicationUrl}
                    className="inline-block rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white no-underline"
                  >
                    {config.ctaLabel}
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
                    You received this email because you submitted an application
                    on Emberly.
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
