import React from 'react'

import {
  EmailButton,
  EmailCallout,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  formatEmailDate,
  useEmailBrand,
} from '../components'

interface DeletionRequestedEmailProps {
  scheduledAt: string
  cancelUrl: string
}

export function DeletionRequestedEmail({
  scheduledAt,
  cancelUrl,
}: DeletionRequestedEmailProps) {
  const { name } = useEmailBrand()
  return (
    <EmailLayout
      preview={`Your ${name} account is scheduled for deletion`}
      reason="We email you about important changes to your account."
    >
      <EmailHeading>Your account is scheduled for deletion</EmailHeading>
      <EmailText>
        Your {name} account will be permanently deleted on the date below.
      </EmailText>
      <EmailDetails rows={[['Deletion date', formatEmailDate(scheduledAt)]]} />
      <EmailCallout tone="danger" title="This can't be undone">
        Once it's deleted, your files, settings and account data are gone for
        good. Changed your mind? Cancel any time before that date.
      </EmailCallout>
      <EmailButton href={cancelUrl}>Cancel deletion</EmailButton>
    </EmailLayout>
  )
}
