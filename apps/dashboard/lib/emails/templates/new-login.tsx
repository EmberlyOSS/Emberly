import React from 'react'

import {
  EmailButton,
  EmailCallout,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  useEmailBrand,
} from '../components'

interface NewLoginEmailProps {
  loginLocation?: string
  loginTime?: string
  loginDevice?: string
  loginIp?: string
  reviewUrl?: string
}

export function NewLoginEmail({
  loginLocation,
  loginTime,
  loginDevice = 'Unknown device',
  loginIp,
  reviewUrl,
}: NewLoginEmailProps) {
  const { name, siteUrl } = useEmailBrand()
  const rows: Array<[string, string]> = [['Device', loginDevice]]
  if (loginLocation) rows.push(['Location', loginLocation])
  if (loginTime) rows.push(['Time', loginTime])
  if (loginIp) rows.push(['IP address', loginIp])

  return (
    <EmailLayout
      preview={`New sign-in from ${loginDevice}`}
      reason={`We email you whenever a new device signs in to your ${name} account.`}
    >
      <EmailHeading>New sign-in to your account</EmailHeading>
      <EmailText>
        Your {name} account was just signed in to from a device we haven't seen
        before.
      </EmailText>
      <EmailDetails rows={rows} />
      <EmailText>If this was you, there's nothing to do.</EmailText>
      <EmailCallout tone="warning" title="Wasn't you?">
        Sign that device out and change your password straight away, then turn
        on two-factor authentication if you haven't already.
      </EmailCallout>
      <EmailButton href={reviewUrl ?? `${siteUrl}/me?tab=security`}>
        Review your devices
      </EmailButton>
    </EmailLayout>
  )
}
