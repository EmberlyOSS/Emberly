import React from 'react'

import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailList,
  EmailText,
} from '../components'

interface NexiumWelcomeEmailProps {
  name?: string
  profileUrl: string
  profileId: string
}

export function NexiumWelcomeEmail({
  name,
  profileUrl,
  profileId,
}: NexiumWelcomeEmailProps) {
  return (
    <EmailLayout
      preview="Your Discovery profile is live"
      reason="You're receiving this because you created a Discovery profile."
    >
      <EmailHeading>Your Discovery profile is live</EmailHeading>
      <EmailText>
        {name ? `Hi ${name}, y` : 'Y'}our profile (<strong>{profileId}</strong>)
        can now be found by teams and opportunities that match your skills. A
        few ways to make it stand out:
      </EmailText>
      <EmailList
        items={[
          'List specific skills and technologies so the right matches find you',
          "Write a short bio about what you build and what you're looking for",
          'Link your GitHub, portfolio or projects',
        ]}
      />
      <EmailButton href={profileUrl}>View your profile</EmailButton>
    </EmailLayout>
  )
}
