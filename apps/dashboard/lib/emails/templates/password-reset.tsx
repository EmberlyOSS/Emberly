import React from 'react'

import {
  EmailButton,
  EmailCallout,
  EmailHeading,
  EmailLayout,
  EmailLinkFallback,
  EmailText,
  useEmailBrand,
} from '../components'

interface PasswordResetEmailProps {
  resetUrl: string
  expiresInMinutes?: number
}

export function PasswordResetEmail({
  resetUrl,
  expiresInMinutes = 30,
}: PasswordResetEmailProps) {
  const { name, siteUrl } = useEmailBrand()
  return (
    <EmailLayout
      preview={`Reset your ${name} password`}
      reason="You're receiving this because someone asked to reset the password for this account."
    >
      <EmailHeading>Reset your password</EmailHeading>
      <EmailText>
        We got a request to reset the password for your {name} account. Use the
        button below to choose a new one.
      </EmailText>
      <EmailButton href={resetUrl}>Reset password</EmailButton>
      <EmailText muted small>
        The link expires in {expiresInMinutes} minutes. Resetting your password
        signs you out everywhere else.
      </EmailText>
      <EmailCallout tone="info" title="Didn't ask for this?">
        You can ignore this email and your password won't change. If you keep
        getting these,{' '}
        <a
          href={`${siteUrl}/contact`}
          style={{ color: 'inherit', fontWeight: 600 }}
        >
          let us know
        </a>
        .
      </EmailCallout>
      <EmailLinkFallback href={resetUrl} />
    </EmailLayout>
  )
}
