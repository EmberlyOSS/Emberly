import React from 'react'

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailText,
  useEmailBrand,
} from '../components'

interface SubscriptionUpdatedEmailProps {
  changeType: 'upgrade' | 'downgrade' | 'update'
  newPlanName: string
}

export function SubscriptionUpdatedEmail({
  changeType,
  newPlanName,
}: SubscriptionUpdatedEmailProps) {
  const { name, siteUrl } = useEmailBrand()
  const changeLabel =
    changeType === 'upgrade'
      ? 'upgraded'
      : changeType === 'downgrade'
        ? 'downgraded'
        : 'updated'

  return (
    <EmailLayout
      preview={`Your ${name} subscription was ${changeLabel}`}
      reason="We email you about changes to your billing."
    >
      <EmailHeading>Your subscription was {changeLabel}</EmailHeading>
      <EmailText>
        Your {name} subscription is now on the <strong>{newPlanName}</strong>{' '}
        plan. The change takes effect immediately.
      </EmailText>
      <EmailButton href={`${siteUrl}/dashboard`}>
        Open your dashboard
      </EmailButton>
    </EmailLayout>
  )
}
