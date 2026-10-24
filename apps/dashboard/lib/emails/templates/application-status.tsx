import React from 'react'

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailQuote,
  EmailText,
  useEmailBrand,
} from '../components'

export type ApplicationStatusType =
  'received' | 'reviewing' | 'approved' | 'rejected'

export interface ApplicationStatusEmailProps {
  recipientName?: string
  applicationType?: string
  status: ApplicationStatusType
  reviewNotes?: string
  applicationUrl?: string
}

const STATUS_COPY: Record<
  ApplicationStatusType,
  { headline: (type: string) => string; body: (type: string) => string }
> = {
  received: {
    headline: (type) => `We got your ${type} application`,
    body: (type) =>
      `Thanks for applying. We'll review your ${type} application and let you know once there's an update.`,
  },
  reviewing: {
    headline: (type) => `Your ${type} application is being reviewed`,
    body: () =>
      "Our team is reviewing your application now. We'll email you as soon as there's a decision.",
  },
  approved: {
    headline: (type) => `Your ${type} application was approved`,
    body: () =>
      'Welcome aboard. Any perks or roles that come with it will be added to your account shortly.',
  },
  rejected: {
    headline: (type) => `Your ${type} application wasn't approved`,
    body: () =>
      "Thanks for your interest. We've decided not to move forward this time, but you're welcome to apply again in the future.",
  },
}

export function ApplicationStatusEmail({
  recipientName,
  applicationType = 'Application',
  status,
  reviewNotes,
  applicationUrl,
}: ApplicationStatusEmailProps) {
  const { siteUrl } = useEmailBrand()
  const copy = STATUS_COPY[status]
  const headline = copy.headline(applicationType)

  return (
    <EmailLayout
      preview={headline}
      reason="You're receiving this because you submitted an application."
    >
      <EmailHeading>{headline}</EmailHeading>
      <EmailText>
        {recipientName ? `Hi ${recipientName}, ` : ''}
        {copy.body(applicationType)}
      </EmailText>
      {reviewNotes && (
        <EmailQuote label="Notes from the reviewer">{reviewNotes}</EmailQuote>
      )}
      <EmailButton href={applicationUrl ?? `${siteUrl}/me?tab=applications`}>
        View your applications
      </EmailButton>
    </EmailLayout>
  )
}
