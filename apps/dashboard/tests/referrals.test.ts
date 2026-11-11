import { beforeEach, describe, expect, mock, test } from 'bun:test'

type Row = Record<string, any>
const users = new Map<string, Row>()
const transactions: Row[] = []
const perks: string[] = []

function applyUpdate(row: Row, data: Row) {
  for (const [key, value] of Object.entries(data)) {
    row[key] =
      value && typeof value === 'object' && 'increment' in value
        ? row[key] + value.increment
        : value
  }
}

const client = {
  $queryRaw: async () => [],
  user: {
    findUnique: async ({ where }: { where: Row }) =>
      where.id
        ? (users.get(where.id) ?? null)
        : ([...users.values()].find(
            (u) => u.referralCode === where.referralCode
          ) ?? null),
    update: async ({ where, data }: { where: Row; data: Row }) => {
      applyUpdate(users.get(where.id)!, data)
    },
  },
  creditTransaction: {
    create: async ({ data }: { data: Row }) => {
      transactions.push(data)
    },
  },
}

mock.module('@emberly/db', () => ({
  prisma: { ...client, $transaction: (run: any) => run(client) },
}))
mock.module('@/lib/perks', () => ({
  addPerkRole: async (id: string, role: string) => {
    perks.push(`${id}:${role}`)
  },
}))

const {
  creditVerifiedReferral,
  isSameMailbox,
  processReferralSignup,
  referrerReward,
  rewardReferrerForPayment,
} = await import('@/lib/referrals')
const { clientIp } = await import('@/lib/security/client-ip')

function user(id: string, extra: Row = {}) {
  users.set(id, {
    id,
    email: `${id}@example.com`,
    emailVerified: null,
    referralCredits: 0,
    referralStats: { count: 0, credited: 0, lastCreditedAt: null },
    ...extra,
  })
  return users.get(id)!
}

describe('referral credits', () => {
  beforeEach(() => {
    users.clear()
    transactions.length = 0
    perks.length = 0
    user('ref', { referralCode: 'CODE', emailVerified: new Date() })
  })

  // Reported by kta1kri: unverified throwaway signups minted $10 each
  test('signing up credits nobody', async () => {
    const puppet = user('new')
    await processReferralSignup('new', 'CODE')
    expect(puppet.referrerUserId).toBe('ref')
    expect(puppet.referralCredits).toBe(0)
    expect(users.get('ref')!.referralCredits).toBe(0)
    expect(perks).toEqual([])
  })

  test('the new account is credited once, only after verifying', async () => {
    const puppet = user('new')
    await processReferralSignup('new', 'CODE')
    await creditVerifiedReferral('new')
    expect(puppet.referralCredits).toBe(0)

    puppet.emailVerified = new Date()
    await creditVerifiedReferral('new')
    await creditVerifiedReferral('new')
    expect(puppet.referralCredits).toBe(10)
    expect(users.get('ref')!.referralCredits).toBe(0)
  })

  test('the referrer is paid once, on the first real payment', async () => {
    user('new')
    await processReferralSignup('new', 'CODE')
    await rewardReferrerForPayment('new', 0)
    expect(users.get('ref')!.referralCredits).toBe(0)

    await rewardReferrerForPayment('new', 2000, 'inv_1')
    await rewardReferrerForPayment('new', 2000, 'inv_2')
    expect(users.get('ref')!.referralCredits).toBe(10)
    expect(perks).toEqual(['ref:AFFILIATE'])
  })

  test('the reward never exceeds the amount paid', () => {
    expect(referrerReward(399)).toBe(3.99)
    expect(referrerReward(5000)).toBe(10)
  })

  test('an unverified referrer earns nothing', async () => {
    users.get('ref')!.emailVerified = null
    user('new')
    await processReferralSignup('new', 'CODE')
    await rewardReferrerForPayment('new', 2000)
    expect(users.get('ref')!.referralCredits).toBe(0)
  })

  test('rewards stop at the cap', async () => {
    users.get('ref')!.referralStats.credited = 10
    user('new')
    await processReferralSignup('new', 'CODE')
    await rewardReferrerForPayment('new', 2000)
    expect(users.get('ref')!.referralCredits).toBe(0)
  })

  test('accounts credited under the old rules are not paid again', async () => {
    const legacy = user('old', {
      referrerUserId: 'ref',
      referralCredits: 10,
      emailVerified: new Date(),
    })
    await creditVerifiedReferral('old')
    await rewardReferrerForPayment('old', 2000)
    expect(legacy.referralCredits).toBe(10)
    expect(users.get('ref')!.referralCredits).toBe(0)
  })

  test('the same mailbox cannot refer itself', async () => {
    expect(isSameMailbox('a.b+x@gmail.com', 'ab@googlemail.com')).toBe(true)
    expect(isSameMailbox('a+x@example.com', 'A@example.com')).toBe(true)
    expect(isSameMailbox('a.b@example.com', 'ab@example.com')).toBe(false)

    users.get('ref')!.email = 'me@example.com'
    const puppet = user('new', { email: 'me+1@example.com' })
    const result = await processReferralSignup('new', 'CODE')
    expect(result.success).toBe(false)
    expect(puppet.referrerUserId).toBeUndefined()
  })
})

describe('clientIp', () => {
  const headers = (init: Record<string, string>) => new Headers(init)

  beforeEach(() => {
    delete process.env.TRUSTED_PROXY
  })

  test('ignores addresses the client added to the header', () => {
    expect(
      clientIp(headers({ 'x-forwarded-for': '1.1.1.1, 203.0.113.9' }))
    ).toBe('203.0.113.9')
  })

  test('counts back by the number of proxies', () => {
    process.env.TRUSTED_PROXY = '2'
    expect(
      clientIp(headers({ 'x-forwarded-for': '1.1.1.1, 203.0.113.9, 10.0.0.1' }))
    ).toBe('203.0.113.9')
  })

  test('only believes Cloudflare when told to', () => {
    const request = headers({
      'cf-connecting-ip': '198.51.100.7',
      'x-forwarded-for': '203.0.113.9',
    })
    expect(clientIp(request)).toBe('203.0.113.9')
    process.env.TRUSTED_PROXY = 'cloudflare'
    expect(clientIp(request)).toBe('198.51.100.7')
    expect(clientIp(headers({ 'x-forwarded-for': '1.1.1.1' }))).toBeUndefined()
  })
})
