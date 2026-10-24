import React from 'react'

import {
  EmailButton,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  formatEmailMoney,
  useEmailBrand,
} from '../components'

interface SubscriptionCreatedEmailProps {
  planName: string
  interval: 'day' | 'month' | 'year'
  amount: number
  currency: string
}

export function SubscriptionCreatedEmail({
  planName,
  interval,
  amount,
  currency,
}: SubscriptionCreatedEmailProps) {
  const { name, siteUrl } = useEmailBrand()
  return (
    <EmailLayout
      preview={`Welcome to ${name} ${planName}`}
      reason="We email you about changes to your billing."
    >
      <EmailHeading>Welcome to {planName}</EmailHeading>
      <EmailText>
        Your subscription is active and every {planName} feature is now unlocked
        on your account.
      </EmailText>
      <EmailDetails
        rows={[
          ['Plan', planName],
          ['Price', `${formatEmailMoney(amount, currency)} per ${interval}`],
        ]}
      />
      <EmailButton href={`${siteUrl}/dashboard`}>
        Open your dashboard
      </EmailButton>
    </EmailLayout>
  )
}
