import React from 'react'

import {
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  formatEmailDate,
  formatEmailMoney,
  useEmailBrand,
} from '../components'

interface RefundIssuedEmailProps {
  amount: number
  currency: string
  reason?: string
}

export function RefundIssuedEmail({
  amount,
  currency,
  reason,
}: RefundIssuedEmailProps) {
  const { name } = useEmailBrand()
  const rows: Array<[string, string]> = [
    ['Amount', formatEmailMoney(amount, currency)],
  ]
  if (reason) rows.push(['Reason', reason])
  rows.push(['Processed', formatEmailDate(new Date())])

  return (
    <EmailLayout
      preview={`Your ${name} refund was processed`}
      reason="We email you about payments and refunds on your account."
    >
      <EmailHeading>Your refund was processed</EmailHeading>
      <EmailText>
        We've issued your refund. It usually shows up on your statement within 5
        to 10 business days.
      </EmailText>
      <EmailDetails rows={rows} />
      <EmailText muted small>
        If it hasn't arrived after 10 business days, check with your bank or
        card provider.
      </EmailText>
    </EmailLayout>
  )
}
