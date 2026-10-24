import React from 'react'

import {
  EmailButton,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  formatEmailDate,
  useEmailBrand,
} from '../components'

interface PerkGainedEmailProps {
  perkName: string
  perkDescription?: string
  perkIcon?: string
  expiresAt?: string | null
  viewUrl?: string
}

export function PerkGainedEmail({
  perkName,
  perkDescription,
  perkIcon = '🎉',
  expiresAt,
  viewUrl,
}: PerkGainedEmailProps) {
  const { name, siteUrl } = useEmailBrand()
  return (
    <EmailLayout
      preview={`You unlocked a new perk: ${perkName}`}
      reason="We email you when perks are added to your account."
    >
      <EmailHeading>
        {perkIcon} You unlocked {perkName}
      </EmailHeading>
      {perkDescription && <EmailText>{perkDescription}</EmailText>}
      <EmailDetails
        rows={[
          ['Perk', perkName],
          ['Expires', expiresAt ? formatEmailDate(expiresAt) : 'Never'],
        ]}
      />
      <EmailButton href={viewUrl ?? `${siteUrl}/me?tab=perks`}>
        View your perks
      </EmailButton>
      <EmailText muted small>
        Thanks for being part of the {name} community.
      </EmailText>
    </EmailLayout>
  )
}
