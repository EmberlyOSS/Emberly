import React from 'react'

// Self-contained markdown-to-email-HTML conversion.
// Uses inline styles throughout — email clients strip external stylesheets.
// No dependency on marked's internal API, which changes across major versions.

function inlineMarkdown(text: string): string {
  return text
    // Bold + italic ***text***
    .replace(/\*\*\*(.+?)\*\*\*/g,
      '<strong style="font-weight:700;color:#111827;"><em style="font-style:italic;">$1</em></strong>')
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g,
      '<strong style="font-weight:700;color:#111827;">$1</strong>')
    // Italic *text* (not **)
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g,
      '<em style="font-style:italic;">$1</em>')
    // Inline code `text`
    .replace(/`([^`]+)`/g,
      '<code style="background:#f3f4f6;border-radius:3px;padding:2px 5px;font-family:monospace;font-size:13px;">$1</code>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" style="color:#ea580c;text-decoration:underline;">$1</a>')
}

function markdownToEmailHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank lines
    if (line.trim() === '') { i++; continue }

    // Fenced code block ```
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      html.push(
        `<pre style="background:#f3f4f6;border-radius:4px;padding:12px;overflow-x:auto;font-size:13px;margin:0 0 12px 0;">` +
        `<code style="font-family:monospace;">${codeLines.join('\n')}</code></pre>`
      )
      continue
    }

    // Horizontal rule ---
    if (/^---+$/.test(line.trim())) {
      html.push('<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />')
      i++; continue
    }

    // Headings h1 / h2 / h3
    const h1 = line.match(/^# (.+)$/)
    const h2 = line.match(/^## (.+)$/)
    const h3 = line.match(/^### (.+)$/)
    if (h1) {
      html.push(`<h1 style="margin:16px 0 8px;font-size:22px;font-weight:700;color:#111827;">${inlineMarkdown(h1[1])}</h1>`)
      i++; continue
    }
    if (h2) {
      html.push(`<h2 style="margin:16px 0 8px;font-size:18px;font-weight:700;color:#111827;">${inlineMarkdown(h2[1])}</h2>`)
      i++; continue
    }
    if (h3) {
      html.push(`<h3 style="margin:16px 0 8px;font-size:16px;font-weight:700;color:#111827;">${inlineMarkdown(h3[1])}</h3>`)
      i++; continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      html.push(
        `<blockquote style="margin:0 0 12px 0;padding:8px 16px;border-left:4px solid #e5e7eb;color:#6b7280;font-style:italic;">` +
        quoteLines.map(l => inlineMarkdown(l)).join('<br/>') +
        `</blockquote>`
      )
      continue
    }

    // Unordered list (- item or * item)
    if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(
          `<li style="margin-bottom:4px;font-size:15px;line-height:1.6;color:#374151;">` +
          `${inlineMarkdown(lines[i].replace(/^[-*] /, ''))}</li>`
        )
        i++
      }
      html.push(`<ul style="margin:0 0 12px 0;padding-left:20px;">${items.join('')}</ul>`)
      continue
    }

    // Ordered list (1. item)
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(
          `<li style="margin-bottom:4px;font-size:15px;line-height:1.6;color:#374151;">` +
          `${inlineMarkdown(lines[i].replace(/^\d+\. /, ''))}</li>`
        )
        i++
      }
      html.push(`<ol style="margin:0 0 12px 0;padding-left:20px;">${items.join('')}</ol>`)
      continue
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,3} /.test(lines[i]) &&
      !/^[-*] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !lines[i].startsWith('> ') &&
      !lines[i].startsWith('```') &&
      !/^---+$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      html.push(
        `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#374151;">` +
        `${inlineMarkdown(paraLines.join(' '))}</p>`
      )
    }
  }

  return html.join('')
}

import {
  Container,
  Head,
  Html,
  Body,
  Section,
  Row,
  Column,
  Text,
  Link,
  Button,
  Hr,
  Preview,
} from '@react-email/components'
import { Tailwind } from '@react-email/tailwind'

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
  senderName = 'Emberly Team',
  priority = 'normal',
  ctaLabel,
  ctaHref,
}: AdminBroadcastEmailProps) {
  const isUrgent = priority === 'high'
  return (
    <Html>
      <Head>
        <Preview>{subject}</Preview>
      </Head>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-2xl px-4 py-8">
            {/* Header */}
            <Section className="mb-8">
              <Row>
                <Column align="left">
                  <Link href="https://embrly.ca" className="inline-block">
                    <Text className="m-0 text-xl font-bold text-orange-600">
                      Emberly
                    </Text>
                  </Link>
                </Column>
              </Row>
            </Section>

            {/* Alert Banner */}
            <Section
              className={`mb-6 border-l-4 rounded-lg p-4 ${
                isUrgent
                  ? 'border-red-500 bg-red-50'
                  : 'border-blue-500 bg-blue-50'
              }`}
            >
              <Text
                className={`m-0 text-sm font-semibold ${
                  isUrgent ? 'text-red-800' : 'text-blue-800'
                }`}
              >
                {isUrgent ? '🚨 Important Notice' : '📢 Announcement'}
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    {subject}
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <div
                    className="m-0 mb-6 text-base leading-relaxed text-gray-700"
                    dangerouslySetInnerHTML={{ __html: markdownToEmailHtml(body) }}
                  />
                </Column>
              </Row>

              {/* CTA Button */}
              {ctaLabel && ctaHref && (
                <Row>
                  <Column align="center">
                    <Button
                      href={ctaHref}
                      className="rounded-lg bg-orange-600 px-8 py-3 text-center text-base font-semibold text-white no-underline"
                    >
                      {ctaLabel}
                    </Button>
                  </Column>
                </Row>
              )}

              {/* Footer note */}
              <Row className="mt-6">
                <Column>
                  <Text className="m-0 text-xs text-gray-600">
                    <strong>Questions?</strong> Please reach out to the Emberly team via{' '}
                    <Link
                      href="https://embrly.ca/contact"
                      className="text-orange-600 no-underline font-semibold"
                    >
                      contact
                    </Link>
                    .
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Bottom Footer */}
            <Section className="mt-12">
              <Hr className="border border-gray-200" />
              <Row className="mt-8">
                <Column align="center">
                  <Text className="m-0 text-xs text-gray-500">
                    © {new Date().getFullYear()} Emberly. All rights reserved.
                  </Text>
                </Column>
              </Row>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
