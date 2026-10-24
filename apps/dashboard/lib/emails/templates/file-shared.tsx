import React from 'react'

import {
  EmailButton,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  colors,
  useEmailBrand,
} from '../components'

interface FileSharedEmailProps {
  recipientName?: string
  ownerName: string
  fileName: string
  fileUrl: string
  role: 'EDITOR' | 'SUGGESTER'
  dashboardUrl?: string
}

export function FileSharedEmail({
  recipientName,
  ownerName,
  fileName,
  fileUrl,
  role,
  dashboardUrl,
}: FileSharedEmailProps) {
  const { siteUrl } = useEmailBrand()
  const roleLabel = role === 'EDITOR' ? 'edit' : 'suggest changes to'

  return (
    <EmailLayout
      preview={`${ownerName} shared ${fileName} with you`}
      reason="You're receiving this because someone shared a file with you."
    >
      <EmailHeading>{ownerName} shared a file with you</EmailHeading>
      <EmailText>
        {recipientName ? `Hi ${recipientName}, ` : ''}
        <strong>{ownerName}</strong> gave you access to {roleLabel} this file.
      </EmailText>
      <EmailDetails
        rows={[
          ['File', fileName],
          ['Your access', role === 'EDITOR' ? 'Editor' : 'Suggester'],
        ]}
      />
      <EmailButton href={fileUrl}>Open file</EmailButton>
      <EmailText muted small>
        You can also find it in your{' '}
        <a
          href={dashboardUrl ?? `${siteUrl}/dashboard/files`}
          style={{ color: colors.accent }}
        >
          shared files
        </a>
        .
      </EmailText>
    </EmailLayout>
  )
}
