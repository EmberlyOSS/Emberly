import { AsyncLocalStorage } from 'node:async_hooks'

import React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface EmailBrand {
  name: string
  logoUrl: string
  siteUrl: string
  manageUrl: string
  showCredit: boolean
}

const DEFAULT_BRAND: EmailBrand = {
  name: 'Emberly',
  logoUrl: 'https://embrly.ca/icon-192.png',
  siteUrl: 'https://embrly.ca',
  manageUrl: 'https://embrly.ca/me?tab=notifications',
  showCredit: false,
}

// React context isn't allowed in modules Server Components can reach, so the
// brand follows the render through async storage instead
const brandStore = new AsyncLocalStorage<EmailBrand>()

export function withEmailBrand<T>(brand: EmailBrand, fn: () => Promise<T>) {
  return brandStore.run(brand, fn)
}

export const useEmailBrand = () => brandStore.getStore() ?? DEFAULT_BRAND

export const colors = {
  page: '#f6f4f2',
  card: '#ffffff',
  border: '#ece7e2',
  text: '#1c1917',
  muted: '#6b6461',
  faint: '#a29a95',
  accent: '#ea580c',
  accentSoft: '#fff4ed',
}

const font =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const TONES = {
  info: { bg: '#f4f6fb', border: '#dbe3f3', text: '#25324d' },
  success: { bg: '#f0f9f3', border: '#cfead8', text: '#1d4630' },
  warning: { bg: '#fff8eb', border: '#f6e1b5', text: '#5c4410' },
  danger: { bg: '#fdf2f2', border: '#f5d0d0', text: '#6b1f1f' },
} as const

export type Tone = keyof typeof TONES

/** The page every email shares: brand header, card, and footer. */
export function EmailLayout({
  preview,
  children,
  reason,
}: {
  preview: string
  children: React.ReactNode
  /** Why the reader got this email, shown in the footer. */
  reason?: string
}) {
  const brand = useEmailBrand()
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.page,
          fontFamily: font,
          margin: 0,
          padding: '32px 12px',
        }}
      >
        <Container style={{ maxWidth: 560, margin: '0 auto' }}>
          <Section style={{ padding: '0 4px 20px' }}>
            <Link href={brand.siteUrl} style={{ textDecoration: 'none' }}>
              <Img
                src={brand.logoUrl}
                width="32"
                height="32"
                alt=""
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  borderRadius: 8,
                }}
              />
              <span
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginLeft: 10,
                  fontSize: 18,
                  fontWeight: 700,
                  color: colors.text,
                }}
              >
                {brand.name}
              </span>
            </Link>
          </Section>

          <Section
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderTop: `3px solid ${colors.accent}`,
              borderRadius: 14,
              padding: '32px 32px 28px',
            }}
          >
            {children}
          </Section>

          <Section style={{ padding: '20px 8px 0', textAlign: 'center' }}>
            {reason && (
              <Text style={{ ...small, margin: '0 0 6px' }}>{reason}</Text>
            )}
            <Text style={{ ...small, margin: 0 }}>
              <Link href={brand.manageUrl} style={footerLink}>
                Notification settings
              </Link>
              {'  ·  '}
              <Link href={brand.siteUrl} style={footerLink}>
                {brand.siteUrl.replace(/^https?:\/\//, '')}
              </Link>
            </Text>
            {brand.showCredit && (
              <Text style={{ ...small, margin: '6px 0 0' }}>
                Powered by{' '}
                <Link href="https://embrly.ca" style={footerLink}>
                  Emberly
                </Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const small = { fontSize: 12, lineHeight: '18px', color: colors.faint }
const footerLink = { color: colors.muted, textDecoration: 'underline' }

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 22,
        lineHeight: '30px',
        fontWeight: 700,
        color: colors.text,
        margin: '0 0 12px',
      }}
    >
      {children}
    </Text>
  )
}

export function EmailText({
  children,
  muted = false,
  small: isSmall = false,
}: {
  children: React.ReactNode
  muted?: boolean
  small?: boolean
}) {
  return (
    <Text
      style={{
        fontSize: isSmall ? 13 : 15,
        lineHeight: isSmall ? '20px' : '24px',
        color: muted ? colors.muted : colors.text,
        margin: '0 0 16px',
      }}
    >
      {children}
    </Text>
  )
}

export function EmailButton({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Section style={{ margin: '24px 0' }}>
      <Button
        href={href}
        style={{
          backgroundColor: colors.accent,
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 600,
          borderRadius: 10,
          padding: '12px 22px',
          textDecoration: 'none',
        }}
      >
        {children}
      </Button>
    </Section>
  )
}

/** A label / value table, e.g. the device and location of a sign-in. */
export function EmailDetails({
  rows,
}: {
  rows: Array<[string, React.ReactNode]>
}) {
  return (
    <Section
      style={{
        backgroundColor: '#faf8f6',
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: '6px 16px',
        margin: '8px 0 20px',
      }}
    >
      <table
        className="email-details"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        role="presentation"
      >
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={label}>
              <td
                style={{
                  fontSize: 13,
                  color: colors.muted,
                  padding: '10px 12px 10px 0',
                  width: 110,
                  verticalAlign: 'top',
                  borderTop: i ? `1px solid ${colors.border}` : 'none',
                }}
              >
                {label}
              </td>
              <td
                style={{
                  fontSize: 14,
                  color: colors.text,
                  padding: '10px 0',
                  fontWeight: 500,
                  borderTop: i ? `1px solid ${colors.border}` : 'none',
                }}
              >
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}

export const plainTextOptions = {
  selectors: [{ selector: 'table.email-details', format: 'dataTable' }],
}

export function EmailCallout({
  tone = 'info',
  title,
  children,
}: {
  tone?: Tone
  title?: string
  children: React.ReactNode
}) {
  const t = TONES[tone]
  return (
    <Section
      style={{
        backgroundColor: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        margin: '8px 0 20px',
      }}
    >
      {title && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: t.text,
            margin: '0 0 4px',
          }}
        >
          {title}
        </Text>
      )}
      <Text
        style={{ fontSize: 13, lineHeight: '20px', color: t.text, margin: 0 }}
      >
        {children}
      </Text>
    </Section>
  )
}

/** A one-time code, large and easy to copy. */
export function EmailCode({ code }: { code: string }) {
  return (
    <Section
      style={{
        backgroundColor: colors.accentSoft,
        border: `1px dashed #f5c3a3`,
        borderRadius: 12,
        padding: '18px 12px',
        margin: '8px 0 20px',
        textAlign: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: "'SFMono-Regular', Menlo, Consolas, monospace",
          fontSize: 30,
          letterSpacing: '8px',
          fontWeight: 700,
          color: colors.text,
          margin: 0,
        }}
      >
        {code}
      </Text>
    </Section>
  )
}

export function EmailList({ items }: { items: React.ReactNode[] }) {
  return (
    <Section style={{ margin: '0 0 16px' }}>
      {items.map((item, i) => (
        <Text
          key={i}
          style={{
            fontSize: 15,
            lineHeight: '24px',
            color: colors.text,
            margin: '0 0 6px',
            paddingLeft: 16,
          }}
        >
          <span
            style={{ color: colors.accent, marginLeft: -16, marginRight: 4 }}
          >
            •{' '}
          </span>
          {item}
        </Text>
      ))}
    </Section>
  )
}

export function EmailQuote({
  label,
  children,
}: {
  label?: string
  children: React.ReactNode
}) {
  return (
    <Section
      style={{
        backgroundColor: '#faf8f6',
        borderLeft: `3px solid ${colors.accent}`,
        borderRadius: 6,
        padding: '14px 16px',
        margin: '8px 0 20px',
      }}
    >
      {label && (
        <Text
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: colors.muted,
            margin: '0 0 6px',
          }}
        >
          {label}
        </Text>
      )}
      <Text
        style={{
          fontSize: 15,
          lineHeight: '24px',
          color: colors.text,
          margin: 0,
          whiteSpace: 'pre-wrap',
        }}
      >
        {children}
      </Text>
    </Section>
  )
}

export function EmailDivider() {
  return <Hr style={{ borderColor: colors.border, margin: '24px 0' }} />
}

export function EmailLinkFallback({ href }: { href: string }) {
  return (
    <EmailText small muted>
      If the button doesn't work, copy this link into your browser:
      <br />
      <Link
        href={href}
        style={{ color: colors.accent, wordBreak: 'break-all' }}
      >
        {href}
      </Link>
    </EmailText>
  )
}

export function formatEmailDate(value: string | number | Date) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  })} UTC`
}

export function formatEmailMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}
