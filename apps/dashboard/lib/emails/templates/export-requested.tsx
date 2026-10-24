import React from 'react'

import {
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  formatEmailDate,
  useEmailBrand,
} from '../components'

interface ExportRequestedEmailProps {
  exportId: string
  requestedAt: string
}

export function ExportRequestedEmail({
  exportId,
  requestedAt,
}: ExportRequestedEmailProps) {
  const { name } = useEmailBrand()
  return (
    <EmailLayout
      preview={`Your ${name} data export is being prepared`}
      reason="You're receiving this because you requested a copy of your data."
    >
      <EmailHeading>We're preparing your data export</EmailHeading>
      <EmailText>
        We got your request for a copy of your {name} data. We'll email you a
        download link as soon as it's ready, which can take a few minutes for
        larger accounts.
      </EmailText>
      <EmailDetails
        rows={[
          ['Export ID', exportId],
          ['Requested', formatEmailDate(requestedAt)],
        ]}
      />
    </EmailLayout>
  )
}
