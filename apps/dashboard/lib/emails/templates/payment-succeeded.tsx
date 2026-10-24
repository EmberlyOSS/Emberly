import React from 'react'

import {
  EmailButton,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  formatEmailDate,
  formatEmailMoney,
  useEmailBrand,
} from '../components'

interface PaymentSucceededEmailProps {
  amount: number
  currency: string
  invoiceId?: string
  receiptUrl?: string
}

export function PaymentSucceededEmail({
  amount,
  currency,
  invoiceId,
  receiptUrl,
}: PaymentSucceededEmailProps) {
  const { name } = useEmailBrand()
  const rows: Array<[string, string]> = [
    ['Amount', formatEmailMoney(amount, currency)],
  ]
  if (invoiceId) rows.push(['Invoice', invoiceId])
  rows.push(['Date', formatEmailDate(new Date())])

  return (
    <EmailLayout
      preview={`Your ${name} payment receipt`}
      reason="We email you a receipt for every payment on your account."
    >
      <EmailHeading>Payment received</EmailHeading>
      <EmailText>Thanks, we've received your payment.</EmailText>
      <EmailDetails rows={rows} />
      {receiptUrl && <EmailButton href={receiptUrl}>View receipt</EmailButton>}
    </EmailLayout>
  )
}
