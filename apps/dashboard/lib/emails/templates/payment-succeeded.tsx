import React from 'react'
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

interface PaymentSucceededEmailProps {
  amount: number
  currency: string
  invoiceId?: string
  receiptUrl?: string
}

export function PaymentSucceededEmail({
  amount,
  currency,
  invoiceId,
  receiptUrl,
}: PaymentSucceededEmailProps) {
  const formattedAmount = (amount / 100).toFixed(2)

  return (
    <Html>
      <Head>
        <Preview>Payment receipt from Emberly</Preview>
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
            <Section className="mb-6 border-l-4 border-green-500 rounded-lg bg-green-50 p-4">
              <Text className="m-0 text-sm font-semibold text-green-800">
                ✓ Payment Received
              </Text>
            </Section>

            {/* Main content */}
            <Section className="border border-gray-200 rounded-lg bg-white p-8">
              <Row>
                <Column>
                  <Text className="m-0 mb-4 text-2xl font-bold text-gray-900">
                    Payment receipt
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text className="m-0 mb-6 text-base leading-relaxed text-gray-700">
                    Thank you! Your payment has been received successfully.
                  </Text>
                </Column>
              </Row>

              {/* Payment details */}
              <Row className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <Column>
                  <Text className="m-0 mb-3 text-sm font-semibold text-gray-900">
                    Payment Details
                  </Text>
                  <Text className="m-0 text-sm text-gray-700">
                    <strong>Amount:</strong> {formattedAmount} {currency}
                  </Text>
                  {invoiceId && (
                    <Text className="m-0 text-sm text-gray-700">
                      <strong>Invoice ID:</strong> {invoiceId}
                    </Text>
                  )}
                  <Text className="m-0 text-sm text-gray-700">
                    <strong>Date:</strong> {new Date().toLocaleString()}
                  </Text>
                </Column>
              </Row>

              {/* CTA */}
              {receiptUrl && (
                <Row className="mt-8">
                  <Column align="center">
                    <Button
                      href={receiptUrl}
                      className="rounded-lg bg-green-600 px-6 py-3 text-center text-base font-semibold text-white no-underline"
                    >
                      View Receipt
                    </Button>
                  </Column>
                </Row>
              )}
            </Section>

            {/* Footer */}
            <Section className="mt-12">
              <Hr className="border border-gray-200" />
              <Row className="mt-8">
                <Column align="center">
                  <Text className="m-0 text-xs text-gray-500">
                    © {new Date().getFullYear()} NodeByte LTD. All rights
                    reserved.
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
