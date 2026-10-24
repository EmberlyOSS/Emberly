import React from 'react'

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailText,
} from '../components'

interface BasicEmailProps {
  title: string
  preheader?: string
  headline?: string
  body: string[]
  cta?: { label: string; href: string }
  footerNote?: string
}

export function BasicEmail({
  title,
  preheader,
  headline = title,
  body,
  cta,
  footerNote,
}: BasicEmailProps) {
  return (
    <EmailLayout preview={preheader || headline || title} reason={footerNote}>
      <EmailHeading>{headline}</EmailHeading>
      {body.map((line, i) => (
        <EmailText key={i}>{line}</EmailText>
      ))}
      {cta && <EmailButton href={cta.href}>{cta.label}</EmailButton>}
    </EmailLayout>
  )
}
