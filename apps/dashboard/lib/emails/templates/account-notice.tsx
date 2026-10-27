import React from 'react'

import {
  EmailButton,
  EmailCallout,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailText,
  type Tone,
} from '../components'

export interface AccountNoticeEmailProps {
  preview: string
  heading: string
  intro: string
  details?: Array<[string, string]>
  callout?: { tone: Tone; title: string; text: string }
  button?: { label: string; href: string }
  /** Why the reader got this email, shown in the footer */
  reason: string
}

/** Short account and security notices: what happened, the details, and what to do. */
export function AccountNoticeEmail({
  preview,
  heading,
  intro,
  details,
  callout,
  button,
  reason,
}: AccountNoticeEmailProps) {
  return (
    <EmailLayout preview={preview} reason={reason}>
      <EmailHeading>{heading}</EmailHeading>
      <EmailText>{intro}</EmailText>
      {details && details.length > 0 && <EmailDetails rows={details} />}
      {callout && (
        <EmailCallout tone={callout.tone} title={callout.title}>
          {callout.text}
        </EmailCallout>
      )}
      {button && <EmailButton href={button.href}>{button.label}</EmailButton>}
    </EmailLayout>
  )
}
