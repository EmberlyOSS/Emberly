import React from 'react'

import {
  EmailButton,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  formatEmailDate,
  useEmailBrand,
} from '../components'

interface EmailChangedNewEmailProps {
  oldEmail: string
  newEmail: string
  changedAt: string
}

export function EmailChangedNewEmail({
  oldEmail,
  newEmail,
  changedAt,
}: EmailChangedNewEmailProps) {
  const { name, siteUrl } = useEmailBrand()
  return (
    <EmailLayout
      preview={`This is now the email address for your ${name} account`}
      reason="We email you about important changes to your account."
    >
      <EmailHeading>Your email address was updated</EmailHeading>
      <EmailText>
        {newEmail} is now the email address for your {name} account. We'll send
        all account emails here from now on.
      </EmailText>
      <EmailDetails
        rows={[
          ['Previous email', oldEmail],
          ['Changed', formatEmailDate(changedAt)],
        ]}
      />
      <EmailButton href={`${siteUrl}/me`}>Go to your account</EmailButton>
    </EmailLayout>
  )
}
