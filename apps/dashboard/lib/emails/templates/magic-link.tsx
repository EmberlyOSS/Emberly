import React from 'react'

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailLinkFallback,
  EmailText,
  useEmailBrand,
} from '../components'

interface MagicLinkEmailProps {
  magicLink: string
  email: string
  expiresInMinutes?: number
}

export function MagicLinkEmail({
  magicLink,
  email,
  expiresInMinutes = 15,
}: MagicLinkEmailProps) {
  const { name } = useEmailBrand()
  return (
    <EmailLayout
      preview={`Your ${name} sign-in link`}
      reason="You're receiving this because someone asked for a sign-in link for this address. If that wasn't you, you can ignore it."
    >
      <EmailHeading>Sign in to {name}</EmailHeading>
      <EmailText>
        Use the button below to sign in as <strong>{email}</strong>.
      </EmailText>
      <EmailButton href={magicLink}>Sign in</EmailButton>
      <EmailText muted small>
        The link expires in {expiresInMinutes} minutes and only works once.
      </EmailText>
      <EmailLinkFallback href={magicLink} />
    </EmailLayout>
  )
}
