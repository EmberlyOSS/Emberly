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

interface EmailChangedOldEmailProps {
  oldEmail: string
  newEmail: string
  changedAt: string
  changedBy?: string
}

export function EmailChangedOldEmail({
  oldEmail,
  newEmail,
  changedAt,
  changedBy,
}: EmailChangedOldEmailProps) {
  const { name, siteUrl } = useEmailBrand()
  return (
    <EmailLayout
      preview={`The email address on your ${name} account was changed`}
      reason="We email your previous address about this change to help keep your account secure."
    >
      <EmailHeading>Your email address was changed</EmailHeading>
      <EmailText>
        The email address on your {name} account was changed
        {changedBy === 'admin' ? ' by an administrator' : ''}. We won't send
        account emails to this address any more.
      </EmailText>
      <EmailDetails
        rows={[
          ['Old email', oldEmail],
          ['New email', newEmail],
          ['Changed', formatEmailDate(changedAt)],
        ]}
      />
      <EmailCallout tone="warning" title="Didn't make this change?">
        Contact support straight away so we can help you secure your account.
      </EmailCallout>
      <EmailButton href={`${siteUrl}/contact`}>Contact support</EmailButton>
    </EmailLayout>
  )
}
