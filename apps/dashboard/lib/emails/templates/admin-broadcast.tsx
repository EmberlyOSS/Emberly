import React from 'react'

import { Section } from '@react-email/components'

import {
  EmailButton,
  EmailCallout,
  EmailHeading,
  EmailLayout,
  colors,
  useEmailBrand,
} from '../components'

const TEXT = `margin:0 0 14px 0;font-size:15px;line-height:24px;color:${colors.text};`
const MONO = "'SFMono-Regular',Menlo,Consolas,monospace"

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function safeHref(url: string) {
  return /^(https?:|mailto:)/i.test(url.trim()) ? url.trim() : '#'
}

function inlineMarkdown(raw: string): string {
  return escapeHtml(raw)
    .replace(
      /\*\*\*(.+?)\*\*\*/g,
      '<strong style="font-weight:700;"><em>$1</em></strong>'
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;">$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(
      /`([^`]+)`/g,
      `<code style="background:#f4f1ee;border-radius:4px;padding:2px 5px;font-family:${MONO};font-size:13px;">$1</code>`
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, label: string, href: string) =>
        `<a href="${safeHref(href)}" style="color:${colors.accent};text-decoration:underline;">${label}</a>`
    )
}

function markdownToEmailHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let i = 0

  const isBlockStart = (line: string) =>
    /^#{1,3} /.test(line) ||
    /^[-*] /.test(line) ||
    /^\d+\. /.test(line) ||
    line.startsWith('> ') ||
    line.startsWith('```') ||
    /^---+$/.test(line.trim())

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    if (line.startsWith('```')) {
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i])
        i++
      }
      i++
      html.push(
        `<pre style="background:#f4f1ee;border-radius:8px;padding:12px;font-size:13px;margin:0 0 14px 0;white-space:pre-wrap;"><code style="font-family:${MONO};">${escapeHtml(code.join('\n'))}</code></pre>`
      )
      continue
    }

    if (/^---+$/.test(line.trim())) {
      html.push(
        `<hr style="border:none;border-top:1px solid ${colors.border};margin:20px 0;" />`
      )
      i++
      continue
    }

    const heading = line.match(/^(#{1,3}) (.+)$/)
    if (heading) {
      const size = [20, 17, 15][heading[1].length - 1]
      html.push(
        `<p style="margin:20px 0 8px;font-size:${size}px;font-weight:700;color:${colors.text};">${inlineMarkdown(heading[2])}</p>`
      )
      i++
      continue
    }

    if (line.startsWith('> ')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quote.push(inlineMarkdown(lines[i].slice(2)))
        i++
      }
      html.push(
        `<blockquote style="margin:0 0 14px 0;padding:8px 16px;border-left:3px solid ${colors.accent};color:${colors.muted};">${quote.join('<br/>')}</blockquote>`
      )
      continue
    }

    const ordered = /^\d+\. /.test(line)
    if (ordered || /^[-*] /.test(line)) {
      const marker = ordered ? /^\d+\. / : /^[-*] /
      const items: string[] = []
      while (i < lines.length && marker.test(lines[i])) {
        items.push(
          `<li style="margin-bottom:4px;font-size:15px;line-height:24px;color:${colors.text};">${inlineMarkdown(lines[i].replace(marker, ''))}</li>`
        )
        i++
      }
      const tag = ordered ? 'ol' : 'ul'
      html.push(
        `<${tag} style="margin:0 0 14px 0;padding-left:20px;">${items.join('')}</${tag}>`
      )
      continue
    }

    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !isBlockStart(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    if (para.length)
      html.push(`<p style="${TEXT}">${inlineMarkdown(para.join(' '))}</p>`)
  }

  return html.join('')
}

interface AdminBroadcastEmailProps {
  subject: string
  body: string
  senderName?: string
  priority?: 'low' | 'normal' | 'high'
  ctaLabel?: string
  ctaHref?: string
}

export function AdminBroadcastEmail({
  subject,
  body,
  senderName,
  priority = 'normal',
  ctaLabel,
  ctaHref,
}: AdminBroadcastEmailProps) {
  const { name, siteUrl } = useEmailBrand()
  return (
    <EmailLayout
      preview={subject}
      reason={`You're receiving this announcement from ${senderName ?? `the ${name} team`}.`}
    >
      {priority === 'high' && (
        <EmailCallout tone="danger" title="Important notice">
          Please read this message carefully.
        </EmailCallout>
      )}
      <EmailHeading>{subject}</EmailHeading>
      <Section>
        <div dangerouslySetInnerHTML={{ __html: markdownToEmailHtml(body) }} />
      </Section>
      {ctaLabel && ctaHref && (
        <EmailButton href={safeHref(ctaHref)}>{ctaLabel}</EmailButton>
      )}
      <p style={{ margin: '8px 0 0', fontSize: 13, color: colors.muted }}>
        Questions?{' '}
        <a href={`${siteUrl}/contact`} style={{ color: colors.accent }}>
          Contact us
        </a>
        .
      </p>
    </EmailLayout>
  )
}
