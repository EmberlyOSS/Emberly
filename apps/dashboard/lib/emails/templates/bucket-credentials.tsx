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

export interface BucketCredentialsEmailProps {
  recipientName?: string
  bucketName: string
  s3Bucket: string
  s3Region: string
  s3AccessKeyId: string
  dashboardUrl?: string
}

const mono = { fontFamily: "'SFMono-Regular', Menlo, Consolas, monospace" }

export function BucketCredentialsEmail({
  recipientName,
  bucketName,
  s3Bucket,
  s3Region,
  s3AccessKeyId,
  dashboardUrl,
}: BucketCredentialsEmailProps) {
  const { siteUrl } = useEmailBrand()
  return (
    <EmailLayout
      preview={`Your storage bucket ${bucketName} is ready`}
      reason="You're receiving this because a storage bucket was set up for your account."
    >
      <EmailHeading>Your storage bucket is ready</EmailHeading>
      <EmailText>
        {recipientName ? `Hi ${recipientName}, w` : 'W'}e've set up your
        dedicated bucket <strong>{bucketName}</strong>. Use these details to
        connect any S3-compatible client.
      </EmailText>
      <EmailDetails
        rows={[
          [
            'Bucket',
            <span key="bucket" style={mono}>
              {s3Bucket}
            </span>,
          ],
          [
            'Region',
            <span key="region" style={mono}>
              {s3Region}
            </span>,
          ],
          [
            'Access key ID',
            <span key="key" style={mono}>
              {s3AccessKeyId}
            </span>,
          ],
        ]}
      />
      <EmailCallout tone="warning" title="Keep these private">
        For security, the secret access key isn't included in this email.
        Contact support if you need it. Store credentials in environment
        variables or a secrets manager, never in public code.
      </EmailCallout>
      <EmailButton href={dashboardUrl ?? `${siteUrl}/dashboard/bucket`}>
        View your bucket
      </EmailButton>
    </EmailLayout>
  )
}
