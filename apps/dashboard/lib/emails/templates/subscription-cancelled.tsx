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

interface SubscriptionCancelledEmailProps {
  effectiveAt: string
  reason?: string
}

export function SubscriptionCancelledEmail({
  effectiveAt,
  reason,
}: SubscriptionCancelledEmailProps) {
  const { name, siteUrl } = useEmailBrand()
  const rows: Array<[string, string]> = [['Ends', formatEmailDate(effectiveAt)]]
  if (reason) rows.push(['Reason', reason])

  return (
    <EmailLayout
      preview={`Your ${name} subscription was cancelled`}
      reason="We email you about changes to your billing."
    >
      <EmailHeading>Your subscription was cancelled</EmailHeading>
      <EmailText>
        Your {name} subscription has been cancelled. Your account moves to the
        free plan once the current period ends.
      </EmailText>
      <EmailDetails rows={rows} />
      <EmailCallout tone="info" title="Changed your mind?">
        You can resubscribe at any time from your billing settings.
      </EmailCallout>
      <EmailButton href={`${siteUrl}/me?tab=billing`}>
        Billing settings
      </EmailButton>
    </EmailLayout>
  )
}
