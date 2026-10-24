import React from 'react'

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailList,
  EmailText,
  colors,
  useEmailBrand,
} from '../components'

interface WelcomeEmailProps {
  name?: string
  verificationUrl?: string
}

export function WelcomeEmail({ name, verificationUrl }: WelcomeEmailProps) {
  const brand = useEmailBrand()
  return (
    <EmailLayout
      preview={`Welcome to ${brand.name}`}
      reason={`You're receiving this because you created a ${brand.name} account.`}
    >
      <EmailHeading>
        Welcome to {brand.name}
        {name ? `, ${name}` : ''}
      </EmailHeading>
      <EmailText>
        Thanks for signing up. Here are a few things you can do to get started:
      </EmailText>
      <EmailList
        items={[
          'Upload files and share them with a link',
          'Create short links and pastes',
          'Connect your own domain',
          'Set up ShareX, Flameshot or the API for one-click uploads',
        ]}
      />
      {verificationUrl ? (
        <EmailButton href={verificationUrl}>Verify your email</EmailButton>
      ) : (
        <EmailButton href={`${brand.siteUrl}/dashboard`}>
          Open your dashboard
        </EmailButton>
      )}
      <EmailText muted small>
        Questions?{' '}
        <a href={`${brand.siteUrl}/contact`} style={{ color: colors.accent }}>
          Get in touch
        </a>
        .
      </EmailText>
    </EmailLayout>
  )
}
