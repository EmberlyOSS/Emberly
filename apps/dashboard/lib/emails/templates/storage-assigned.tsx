import React from 'react'

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailText,
  useEmailBrand,
} from '../components'

interface StorageAssignedEmailProps {
  storageAmount: string
  reason?: string
  usageUrl?: string
}

export function StorageAssignedEmail({
  storageAmount,
  reason = 'as part of your subscription',
  usageUrl,
}: StorageAssignedEmailProps) {
  const { siteUrl } = useEmailBrand()
  return (
    <EmailLayout
      preview={`You've been given ${storageAmount} of extra storage`}
      reason="We email you about changes to your account limits."
    >
      <EmailHeading>You've got more storage</EmailHeading>
      <EmailText>
        You've been given <strong>{storageAmount}</strong> of extra storage{' '}
        {reason}. It's available on your account now.
      </EmailText>
      <EmailButton href={usageUrl ?? `${siteUrl}/dashboard`}>
        View your storage
      </EmailButton>
    </EmailLayout>
  )
}
