import React from 'react'

import {
  EmailButton,
  EmailDetails,
  EmailHeading,
  EmailLayout,
  EmailList,
  EmailText,
  colors,
  useEmailBrand,
} from '../components'

interface QuotaReachedEmailProps {
  currentUsage: number
  quotaLimit: number
  percentage: number
  unit?: string
  dashboardUrl?: string
}

export function QuotaReachedEmail({
  currentUsage,
  quotaLimit,
  percentage,
  unit = 'GB',
  dashboardUrl,
}: QuotaReachedEmailProps) {
  const { siteUrl } = useEmailBrand()
  const filled = Math.max(1, Math.min(100, Math.round(percentage)))

  return (
    <EmailLayout
      preview={`You've used ${percentage.toFixed(0)}% of your storage`}
      reason="We email you when your storage is nearly full."
    >
      <EmailHeading>You're running low on storage</EmailHeading>
      <EmailText>
        You've used {percentage.toFixed(1)}% of your storage.
      </EmailText>
      <table
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        role="presentation"
        data-skip-in-text="true"
        style={{ margin: '0 0 16px', borderCollapse: 'separate' }}
      >
        <tbody>
          <tr>
            <td
              width={`${filled}%`}
              style={{
                height: 8,
                backgroundColor: percentage >= 90 ? '#dc2626' : colors.accent,
                borderRadius: filled === 100 ? 4 : '4px 0 0 4px',
              }}
            />
            {filled < 100 && (
              <td
                style={{
                  height: 8,
                  backgroundColor: colors.border,
                  borderRadius: '0 4px 4px 0',
                }}
              />
            )}
          </tr>
        </tbody>
      </table>
      <EmailDetails
        rows={[
          ['Used', `${currentUsage.toFixed(1)} ${unit}`],
          ['Limit', `${quotaLimit.toFixed(1)} ${unit}`],
        ]}
      />
      <EmailText>To free up space, you can:</EmailText>
      <EmailList
        items={[
          "Delete files you don't need any more",
          'Upgrade to a plan with more storage',
          'Contact support to ask for more',
        ]}
      />
      <EmailButton href={dashboardUrl ?? `${siteUrl}/dashboard/files`}>
        Manage your files
      </EmailButton>
    </EmailLayout>
  )
}
