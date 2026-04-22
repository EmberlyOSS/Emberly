/**
 * Stripe integration utilities for referral credits
 */

import Stripe from 'stripe'
import { prisma } from '@/packages/lib/database/prisma'

/**
 * Apply referral credits to a Stripe customer as account balance
 * Stripe supports negative balances (credits) via the customer's account balance
 */
export async function applyReferralCreditsToStripe(
  userId: string,
  stripeClient: Stripe,
  metadata?: { relatedOrderId?: string }
): Promise<{ applied: boolean; creditAmount: number; newBalance: number }> {
  let customerId: string | null = null
  let originalBalance = 0

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCredits: true,
        stripeCustomerId: true,
      },
    })

    if (!user?.referralCredits || user.referralCredits <= 0) {
      return {
        applied: false,
        creditAmount: 0,
        newBalance: 0,
      }
    }

    customerId = user.stripeCustomerId

    if (!customerId) {
      console.warn(`[Stripe Credits] User ${userId} has no Stripe customer ID`)
      return {
        applied: false,
        creditAmount: 0,
        newBalance: 0,
      }
    }

    // Convert credits to cents (referral credits are in dollars)
    const creditCents = Math.round(user.referralCredits * 100)

    // Update customer balance (negative balance = customer credit)
    // Stripe's balance field: positive = customer owes money, negative = customer has credit
    const customer = await stripeClient.customers.retrieve(customerId)
    originalBalance = (customer as any).balance || 0
    const newBalance = originalBalance - creditCents // Subtract (which adds credit)

    await stripeClient.customers.update(customerId, {
      balance: newBalance,
      metadata: {
        referralCredits: user.referralCredits.toString(),
        creditsAppliedAt: new Date().toISOString(),
      },
    })

    // Persist the credit removal and audit trail together. If this fails, roll
    // the Stripe balance back so credits cannot exist in both systems.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          referralCredits: 0,
        },
      })

      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'applied_checkout',
          amountCents: -creditCents,
          description: `Applied $${user.referralCredits} to Stripe account balance`,
          relatedOrderId: metadata?.relatedOrderId,
          metadata: metadata || {},
        },
      })
    })

    console.log(
      `[Stripe Credits] Applied $${user.referralCredits} credit to user ${userId}, Stripe balance: $${newBalance / 100}`
    )

    return {
      applied: true,
      creditAmount: user.referralCredits,
      newBalance: newBalance / 100, // Convert back to dollars for response
    }
  } catch (error) {
    if (customerId) {
      try {
        await stripeClient.customers.update(customerId, { balance: originalBalance })
      } catch (rollbackError) {
        console.error('[Stripe Credits] Failed to roll back Stripe balance:', rollbackError)
      }
    }

    console.error('[Stripe Credits] Failed to apply referral credits:', error)
    return {
      applied: false,
      creditAmount: 0,
      newBalance: 0,
    }
  }
}

/**
 * Get current Stripe balance for a customer
 */
export async function getStripeBalance(
  customerId: string,
  stripeClient: Stripe
): Promise<number> {
  try {
    const customer = await stripeClient.customers.retrieve(customerId)
    const balance = (customer as any).balance || 0
    return balance / 100 // Convert cents to dollars
  } catch (error) {
    console.error('[Stripe] Failed to get customer balance:', error)
    return 0
  }
}

/**
 * Create a Stripe customer if they don't exist
 */
export async function ensureStripeCustomer(
  userId: string,
  userEmail: string | null | undefined,
  stripeClient: Stripe
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })

  let customerId = user?.stripeCustomerId

  // Verify existing customer ID is still valid
  if (customerId) {
    try {
      await stripeClient.customers.retrieve(customerId)
      return customerId
    } catch (e: any) {
      console.warn(`[Stripe] Stored customer ID invalid, creating new one: ${e?.message}`)
    }
  }

  // Create new customer
  const customer = await stripeClient.customers.create({
    email: userEmail || undefined,
    metadata: { userId },
  })

  // Save new customer ID
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

/**
 * Get credit transaction history for a user
 */
export async function getCreditHistory(userId: string, limit: number = 50) {
  return prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Manually adjust credits (for admin use or corrections)
 */
export async function adjustCredits(
  userId: string,
  amountCents: number,
  reason: string,
  relatedUserId?: string
) {
  const transaction = await prisma.creditTransaction.create({
    data: {
      userId,
      type: 'manual_adjustment',
      amountCents,
      description: reason,
      relatedUserId,
    },
  })

  // If positive adjustment, add to user's pending credits
  if (amountCents > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        referralCredits: {
          increment: amountCents / 100, // Convert cents to dollars
        },
      },
    })
  }

  return transaction
}

