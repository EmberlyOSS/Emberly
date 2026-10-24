import React from 'react'

import {
  EmailButton,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  colors,
} from '../components'

interface NexiumSquadInviteEmailProps {
  name?: string
  squadName: string
  inviterName: string
  inviteUrl: string
  declineUrl: string
}

export function NexiumSquadInviteEmail({
  name,
  squadName,
  inviterName,
  inviteUrl,
  declineUrl,
}: NexiumSquadInviteEmailProps) {
  return (
    <EmailLayout
      preview={`${inviterName} invited you to join ${squadName}`}
      reason={`You're receiving this because ${inviterName} invited you to a squad. If you don't know them, you can ignore it.`}
    >
      <EmailHeading>You're invited to join {squadName}</EmailHeading>
      <EmailText>
        {name ? `Hi ${name}, ` : ''}
        <strong>{inviterName}</strong> invited you to join their squad. Squads
        let you work with other builders and share opportunities as a team.
      </EmailText>
      <EmailDetails
        rows={[
          ['Squad', squadName],
          ['Invited by', inviterName],
          ['Expires', 'In 7 days'],
        ]}
      />
      <EmailButton href={inviteUrl}>Accept invite</EmailButton>
      <EmailText muted small>
        Not interested?{' '}
        <a href={declineUrl} style={{ color: colors.muted }}>
          Decline the invite
        </a>
        .
      </EmailText>
    </EmailLayout>
  )
}
