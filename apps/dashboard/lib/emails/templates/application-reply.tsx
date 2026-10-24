import React from 'react'

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailQuote,
  EmailText,
  useEmailBrand,
} from '../components'

export interface ApplicationReplyEmailProps {
  recipientName?: string
  replyContent: string
  senderName?: string
  isStaffReply: boolean
  applicationType?: string
  applicationUrl?: string
}

export function ApplicationReplyEmail({
  recipientName,
  replyContent,
  senderName,
  isStaffReply,
  applicationType = 'Application',
  applicationUrl,
}: ApplicationReplyEmailProps) {
  const { name, siteUrl } = useEmailBrand()
  const intro = isStaffReply
    ? `The ${name} team replied to your ${applicationType} application.`
    : `An applicant replied to their ${applicationType} application.`
  const label = senderName
    ? senderName
    : isStaffReply
      ? `${name} team`
      : 'Applicant'

  return (
    <EmailLayout
      preview={intro}
      reason="You're receiving this because of activity on an application."
    >
      <EmailHeading>
        {isStaffReply
          ? 'New reply on your application'
          : `New reply on a ${applicationType} application`}
      </EmailHeading>
      <EmailText>
        {recipientName ? `Hi ${recipientName}, ` : ''}
        {intro}
      </EmailText>
      <EmailQuote label={label}>{replyContent}</EmailQuote>
      <EmailButton href={applicationUrl ?? `${siteUrl}/me?tab=applications`}>
        View application
      </EmailButton>
    </EmailLayout>
  )
}
