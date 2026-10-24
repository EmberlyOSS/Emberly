import React from 'react'

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailText,
} from '../components'

interface NexiumSquadInviteAcceptedEmailProps {
  ownerName?: string
  memberName: string
  squadName: string
  squadUrl: string
}

export function NexiumSquadInviteAcceptedEmail({
  ownerName,
  memberName,
  squadName,
  squadUrl,
}: NexiumSquadInviteAcceptedEmailProps) {
  return (
    <EmailLayout
      preview={`${memberName} joined ${squadName}`}
      reason="You're receiving this because you invited someone to your squad."
    >
      <EmailHeading>{memberName} joined your squad</EmailHeading>
      <EmailText>
        {ownerName ? `Hi ${ownerName}, ` : ''}
        <strong>{memberName}</strong> accepted your invitation and is now a
        member of <strong>{squadName}</strong>.
      </EmailText>
      <EmailButton href={squadUrl}>View squad</EmailButton>
    </EmailLayout>
  )
}
