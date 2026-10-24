import React from 'react'

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailText,
  useEmailBrand,
} from '../components'

interface NexiumSquadInviteDeclinedEmailProps {
  ownerName?: string
  memberName: string
  squadName: string
}

export function NexiumSquadInviteDeclinedEmail({
  ownerName,
  memberName,
  squadName,
}: NexiumSquadInviteDeclinedEmailProps) {
  const { siteUrl } = useEmailBrand()
  return (
    <EmailLayout
      preview={`${memberName} declined your invite to ${squadName}`}
      reason="You're receiving this because you invited someone to your squad."
    >
      <EmailHeading>Squad invite declined</EmailHeading>
      <EmailText>
        {ownerName ? `Hi ${ownerName}, ` : ''}
        <strong>{memberName}</strong> declined your invitation to join{' '}
        <strong>{squadName}</strong>. You can invite someone else from your
        squad's Members tab.
      </EmailText>
      <EmailButton href={`${siteUrl}/dashboard/discovery`}>
        Open Discovery
      </EmailButton>
    </EmailLayout>
  )
}
