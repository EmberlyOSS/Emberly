import React from 'react'

import {
  EmailButton,
  EmailCode,
  EmailHeading,
  EmailLayout,
  EmailText,
  useEmailBrand,
} from '../components'

interface VerificationCodeEmailProps {
  code: string
  verificationUrl?: string
  expiresInMinutes?: number
}

export function VerificationCodeEmail({
  code,
  verificationUrl,
  expiresInMinutes = 30,
}: VerificationCodeEmailProps) {
  const { name } = useEmailBrand()
  return (
    <EmailLayout
      preview={`Your ${name} verification code is ${code}`}
      reason="You're receiving this because someone entered your email address. If that wasn't you, you can ignore it."
    >
      <EmailHeading>Your verification code</EmailHeading>
      <EmailText>Enter this code to confirm it's you:</EmailText>
      <EmailCode code={code} />
      {verificationUrl && (
        <EmailButton href={verificationUrl}>Verify automatically</EmailButton>
      )}
      <EmailText muted small>
        The code expires in {expiresInMinutes} minutes and can only be used
        once. {name} will never ask you for it by email, chat or phone.
      </EmailText>
    </EmailLayout>
  )
}
