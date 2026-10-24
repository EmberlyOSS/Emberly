import React from 'react'

import {
  EmailButton,
  EmailCallout,
  EmailHeading,
  EmailLayout,
  EmailList,
  EmailText,
  useEmailBrand,
} from '../components'

interface AccountChangeEmailProps {
  userName?: string
  changes: string[]
  manageUrl?: string
  supportUrl?: string
}

export function AccountChangeEmail({
  userName,
  changes,
  manageUrl,
  supportUrl,
}: AccountChangeEmailProps) {
  const { name, siteUrl } = useEmailBrand()
  return (
    <EmailLayout
      preview={`Your ${name} account was changed`}
      reason="We email you about important changes to your account to help keep it secure."
    >
      <EmailHeading>Your account was changed</EmailHeading>
      <EmailText>
        {userName ? `Hi ${userName}, the` : 'The'} following changes were made
        to your {name} account:
      </EmailText>
      <EmailList items={changes} />
      <EmailButton href={manageUrl ?? `${siteUrl}/me`}>
        Review your account
      </EmailButton>
      <EmailCallout tone="warning" title="Didn't make this change?">
        Change your password and sign out your other devices, then{' '}
        <a
          href={supportUrl ?? `${siteUrl}/contact`}
          style={{ color: 'inherit', fontWeight: 600 }}
        >
          contact support
        </a>
        .
      </EmailCallout>
    </EmailLayout>
  )
}
