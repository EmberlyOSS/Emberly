import React from 'react'

import {
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  formatEmailDate,
  useEmailBrand,
} from '../components'

interface AccountDeletedEmailProps {
  deletedAt: string
  reason?: string
}

export function AccountDeletedEmail({
  deletedAt,
  reason,
}: AccountDeletedEmailProps) {
  const { name, siteUrl } = useEmailBrand()
  const rows: Array<[string, string]> = [
    ['Deleted', formatEmailDate(deletedAt)],
  ]
  if (reason) rows.push(['Reason', reason])

  return (
    <EmailLayout
      preview={`Your ${name} account was deleted`}
      reason="This is the last email we'll send to this address about the account."
    >
      <EmailHeading>Your account was deleted</EmailHeading>
      <EmailText>
        Your {name} account has been permanently deleted, along with its files,
        settings and other data.
      </EmailText>
      <EmailDetails rows={rows} />
      <EmailText muted small>
        This can't be undone. If you have questions, you can still{' '}
        <a href={`${siteUrl}/contact`} style={{ color: 'inherit' }}>
          contact support
        </a>
        .
      </EmailText>
    </EmailLayout>
  )
}
