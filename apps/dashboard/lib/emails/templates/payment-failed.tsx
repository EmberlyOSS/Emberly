import React from 'react'

import {
  EmailButton,
  EmailCallout,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  formatEmailDate,
  formatEmailMoney,
  useEmailBrand,
} from '../components'

interface PaymentFailedEmailProps {
  amount: number
  currency: string
  failureReason: string
  nextRetryAt?: string
  updatePaymentUrl: string
}

export function PaymentFailedEmail({
  amount,
  currency,
  failureReason,
  nextRetryAt,
  updatePaymentUrl,
}: PaymentFailedEmailProps) {
  const { name } = useEmailBrand()
  const rows: Array<[string, string]> = [
    ['Amount', formatEmailMoney(amount, currency)],
    ['Reason', failureReason],
  ]
  if (nextRetryAt) rows.push(['Next attempt', formatEmailDate(nextRetryAt)])

  return (
    <EmailLayout
      preview={`Your ${name} payment didn't go through`}
      reason="We email you about payments on your account."
    >
      <EmailHeading>Your payment didn't go through</EmailHeading>
      <EmailText>
        We couldn't take a payment for your {name} subscription.
      </EmailText>
      <EmailDetails rows={rows} />
      <EmailCallout tone="danger" title="Action needed">
        Update your payment method to keep your subscription active.
      </EmailCallout>
      <EmailButton href={updatePaymentUrl}>Update payment method</EmailButton>
    </EmailLayout>
  )
}
