import React from 'react'

import {
  EmailCallout,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  formatEmailDate,
  useEmailBrand,
} from '../components'

interface DeletionCancelledEmailProps {
  cancelledAt: string
}

export function DeletionCancelledEmail({
  cancelledAt,
}: DeletionCancelledEmailProps) {
  const { name } = useEmailBrand()
  return (
    <EmailLayout
      preview={`Your ${name} account deletion was cancelled`}
      reason="We email you about important changes to your account."
    >
      <EmailHeading>Account deletion cancelled</EmailHeading>
      <EmailText>
        Your account deletion request was cancelled and your {name} account is
        active again.
      </EmailText>
      <EmailDetails rows={[['Cancelled', formatEmailDate(cancelledAt)]]} />
      <EmailCallout tone="success" title="Everything is still here">
        All of your files and settings have been kept.
      </EmailCallout>
    </EmailLayout>
  )
}
