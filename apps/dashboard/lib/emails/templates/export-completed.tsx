import React from 'react'

import {
  EmailButton,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailLinkFallback,
  EmailText,
  formatEmailDate,
  useEmailBrand,
} from '../components'

interface ExportCompletedEmailProps {
  downloadUrl: string
  expiresAt?: string
  exportId: string
}

export function ExportCompletedEmail({
  downloadUrl,
  expiresAt,
  exportId,
}: ExportCompletedEmailProps) {
  const { name } = useEmailBrand()
  const rows: Array<[string, string]> = [['Export ID', exportId]]
  if (expiresAt) rows.push(['Link expires', formatEmailDate(expiresAt)])

  return (
    <EmailLayout
      preview={`Your ${name} data export is ready`}
      reason="You're receiving this because you requested a copy of your data."
    >
      <EmailHeading>Your data export is ready</EmailHeading>
      <EmailText>Your {name} data export is ready to download.</EmailText>
      <EmailButton href={downloadUrl}>Download your data</EmailButton>
      <EmailDetails rows={rows} />
      <EmailLinkFallback href={downloadUrl} />
    </EmailLayout>
  )
}
