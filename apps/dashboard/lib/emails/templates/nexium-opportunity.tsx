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

interface NexiumOpportunityEmailProps {
  name?: string
  opportunityTitle: string
  opportunityUrl: string
  companyName?: string
  skills: string[]
}

export function NexiumOpportunityEmail({
  name,
  opportunityTitle,
  opportunityUrl,
  companyName,
  skills = [],
}: NexiumOpportunityEmailProps) {
  const { siteUrl } = useEmailBrand()
  const rows: Array<[string, string]> = [['Role', opportunityTitle]]
  if (companyName) rows.push(['Company', companyName])
  if (skills.length) rows.push(['Matched skills', skills.join(', ')])

  return (
    <EmailLayout
      preview={`New opportunity for you: ${opportunityTitle}`}
      reason="You're receiving this because your Discovery profile matched an opportunity."
    >
      <EmailHeading>A new opportunity matches your profile</EmailHeading>
      <EmailText>
        {name ? `Hi ${name}, a` : 'A'} new opportunity matches the skills on
        your Discovery profile.
      </EmailText>
      <EmailDetails rows={rows} />
      <EmailButton href={opportunityUrl}>View opportunity</EmailButton>
      <EmailText muted small>
        Not looking right now?{' '}
        <a
          href={`${siteUrl}/dashboard/discovery`}
          style={{ color: colors.accent }}
        >
          Update your Discovery profile
        </a>
        .
      </EmailText>
    </EmailLayout>
  )
}
