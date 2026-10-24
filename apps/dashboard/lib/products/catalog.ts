import { prisma, type Product } from '@emberly/db'

import { syncProductToStripe } from '@/lib/stripe/sync'

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

export interface PlanSeed {
  slug: string
  name: string
  description: string
  type: 'plan' | 'nexium-plan' | 'addon'
  defaultPriceCents: number | null
  billingInterval: 'month' | 'one-time' | 'year' | null
  storageQuotaGB: number | null
  uploadSizeCapMB: number | null
  customDomainsLimit: number | null
  features: string[]
  active: boolean
  popular: boolean
}

const EMBERLY_PLANS: PlanSeed[] = [
  {
    slug: 'free',
    name: 'Spark (Free)',
    description: 'Everything you need to get started free, forever.',
    type: 'plan',
    defaultPriceCents: 0,
    billingInterval: null,
    storageQuotaGB: 10,
    uploadSizeCapMB: 500,
    customDomainsLimit: 3,
    features: [
      '10 GB storage',
      '500 MB max upload size',
      'Up to 3 custom domains',
      'Basic analytics',
      'Community support',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'glow',
    name: 'Glow',
    description: 'For creators who want more space and visibility.',
    type: 'plan',
    defaultPriceCents: 499,
    billingInterval: 'month',
    storageQuotaGB: 25,
    uploadSizeCapMB: 1024,
    customDomainsLimit: 5,
    features: [
      '25 GB storage',
      '1 GB max upload size',
      'Up to 5 custom domains',
      'Analytics dashboard',
      'Email support',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'flare',
    name: 'Flare',
    description: 'For professionals who need power without limits.',
    type: 'plan',
    defaultPriceCents: 899,
    billingInterval: 'month',
    storageQuotaGB: 50,
    uploadSizeCapMB: 2048,
    customDomainsLimit: 10,
    features: [
      '50 GB storage',
      '2 GB max upload size',
      'Up to 10 custom domains',
      'Advanced analytics',
      'Priority email support',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'blaze',
    name: 'Blaze',
    description: 'Built for teams that move fast and share everything.',
    type: 'plan',
    defaultPriceCents: 1499,
    billingInterval: 'month',
    storageQuotaGB: 100,
    uploadSizeCapMB: 5120,
    customDomainsLimit: null, // unlimited
    features: [
      '100 GB storage',
      '5 GB max upload size',
      'Unlimited custom domains',
      'Advanced analytics',
      'Team collaboration tools',
      'Priority support',
    ],
    active: true,
    popular: true,
  },
  {
    slug: 'inferno',
    name: 'Inferno',
    description: 'Enterprise-grade power for ambitious organisations.',
    type: 'plan',
    defaultPriceCents: 2499,
    billingInterval: 'month',
    storageQuotaGB: 250,
    uploadSizeCapMB: 10240,
    customDomainsLimit: null, // unlimited
    features: [
      '250 GB storage',
      '10 GB max upload size',
      'Unlimited custom domains',
      'Advanced analytics',
      'SSO & advanced auth',
      'Team collaboration tools',
      'Priority support + SLA',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'ember',
    name: 'Ember',
    description: 'No limits. Seriously.',
    type: 'plan',
    defaultPriceCents: 4999,
    billingInterval: 'month',
    storageQuotaGB: null, // unlimited
    uploadSizeCapMB: null, // unlimited
    customDomainsLimit: null, // unlimited
    features: [
      'Unlimited storage',
      'Unlimited upload size',
      'Unlimited custom domains',
      'Advanced analytics',
      'SSO & advanced auth',
      'Team collaboration tools',
      'Dedicated account manager',
      'Priority support + SLA',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Dedicated infrastructure, white-glove support.',
    type: 'plan',
    defaultPriceCents: null, // contact us
    billingInterval: null,
    storageQuotaGB: null, // unlimited
    uploadSizeCapMB: null, // unlimited
    customDomainsLimit: null, // unlimited
    features: [
      'Unlimited storage',
      'Unlimited upload size',
      'Unlimited custom domains',
      'Advanced analytics',
      'SSO & SAML',
      'Custom integrations',
      'Dedicated support team',
      'Custom SLA',
      'Compliance assistance',
    ],
    active: true,
    popular: false,
  },
]

const NEXIUM_PLANS: PlanSeed[] = [
  {
    slug: 'nexium-free',
    name: 'Discovery Free',
    description: 'Get your squad on the map totally free.',
    type: 'nexium-plan',
    defaultPriceCents: 0,
    billingInterval: null,
    storageQuotaGB: 5,
    uploadSizeCapMB: 100,
    customDomainsLimit: 1,
    features: [
      'Up to 3 squad members',
      '5 GB squad storage',
      'Basic squad profile',
      'Community signals',
      '1 squad domain',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'nexium-pro',
    name: 'Discovery Pro',
    description: 'Level up with verified signals and analytics.',
    type: 'nexium-plan',
    defaultPriceCents: 799,
    billingInterval: 'month',
    storageQuotaGB: 20,
    uploadSizeCapMB: 500,
    customDomainsLimit: 3,
    features: [
      'Up to 10 squad members',
      '20 GB squad storage',
      '500 MB max upload size',
      'Enhanced squad profile',
      'Verified signals',
      'Analytics dashboard',
      'Up to 3 squad domains',
      'Email support',
    ],
    active: true,
    popular: true,
  },
  {
    slug: 'nexium-team',
    name: 'Discovery Team',
    description: 'API access, advanced analytics, and serious scale.',
    type: 'nexium-plan',
    defaultPriceCents: 1999,
    billingInterval: 'month',
    storageQuotaGB: 50,
    uploadSizeCapMB: 2048,
    customDomainsLimit: 10,
    features: [
      'Up to 25 squad members',
      '50 GB squad storage',
      '2 GB max upload size',
      'API key access',
      'Advanced analytics',
      'Up to 10 squad domains',
      'Priority support',
      'Custom squad branding',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'nexium-studio',
    name: 'Discovery Studio',
    description: 'Unlimited scale for elite squads and organisations.',
    type: 'nexium-plan',
    defaultPriceCents: 4999,
    billingInterval: 'month',
    storageQuotaGB: null, // unlimited
    uploadSizeCapMB: null, // unlimited
    customDomainsLimit: null, // unlimited
    features: [
      'Unlimited squad members',
      'Unlimited squad storage',
      'Unlimited upload size',
      'Unlimited squad domains',
      'Full API access',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support',
      'White-glove onboarding',
    ],
    active: true,
    popular: false,
  },
]

// ---------------------------------------------------------------------------
// Add-on plans
// ---------------------------------------------------------------------------

const ADDON_PLANS: PlanSeed[] = [
  {
    slug: 'extra-domain-slot',
    name: 'Extra Domain Slot',
    description: 'Add an additional custom domain to your Emberly account.',
    type: 'addon',
    defaultPriceCents: 1200, // $12/year per domain
    billingInterval: 'year',
    storageQuotaGB: null,
    uploadSizeCapMB: null,
    customDomainsLimit: null,
    features: [
      '1 additional custom domain',
      'Billed annually at $12/year',
      'Renews each year',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'extra-domain-slot-squad',
    name: 'Extra Domain Slot (Squad)',
    description: 'Add an additional custom domain to your Emberly squad.',
    type: 'addon',
    defaultPriceCents: 1500, // $15/year per domain (squad premium)
    billingInterval: 'year',
    storageQuotaGB: null,
    uploadSizeCapMB: null,
    customDomainsLimit: null,
    features: [
      '1 additional custom domain for your squad',
      'Billed annually at $15/year',
      'Renews each year',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'extra-storage-1gb',
    name: 'Extra Storage (1 GB)',
    description: 'Expand your Emberly personal storage by 1 GB.',
    type: 'addon',
    defaultPriceCents: 25, // $0.25/GB/month
    billingInterval: 'month',
    storageQuotaGB: 1,
    uploadSizeCapMB: null,
    customDomainsLimit: null,
    features: [
      '1 GB additional storage per unit',
      'Monthly or yearly billing',
      'Cancel anytime',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'extra-storage-1gb-squad',
    name: 'Extra Storage (1 GB) — Squad',
    description: "Expand your squad's Emberly storage by 1 GB.",
    type: 'addon',
    defaultPriceCents: 25, // $0.25/GB/month
    billingInterval: 'month',
    storageQuotaGB: 1,
    uploadSizeCapMB: null,
    customDomainsLimit: null,
    features: [
      '1 GB additional squad storage per unit',
      'Monthly or yearly billing',
      'Cancel anytime',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'verify-personal',
    name: 'Verified Badge',
    description:
      'Purchase a verified badge for your Emberly profile skip the review queue.',
    type: 'addon',
    defaultPriceCents: 999, // $9.99 one-time
    billingInterval: 'one-time',
    storageQuotaGB: null,
    uploadSizeCapMB: null,
    customDomainsLimit: null,
    features: [
      'Verified checkmark on your profile',
      'Skip the standard review queue',
      'One-time purchase',
      'Never expires',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'verify-squad',
    name: 'Verified Badge (Squad)',
    description:
      'Purchase a verified badge for your Emberly squad skip the review queue.',
    type: 'addon',
    defaultPriceCents: 1499, // $14.99 one-time
    billingInterval: 'one-time',
    storageQuotaGB: null,
    uploadSizeCapMB: null,
    customDomainsLimit: null,
    features: [
      'Verified checkmark on your squad',
      'Skip the standard review queue',
      'One-time purchase',
      'Never expires',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'upload-cap-personal',
    name: 'Upload Cap Increase (1 GB)',
    description:
      'Increase your personal max single-file upload size by 1 GB per unit.',
    type: 'addon',
    defaultPriceCents: 25, // $0.25/GB/month
    billingInterval: 'month',
    storageQuotaGB: null,
    uploadSizeCapMB: 1024, // +1 GB per unit
    customDomainsLimit: null,
    features: [
      '+1 GB upload cap per unit',
      'Monthly or yearly billing',
      'Cancel anytime',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'upload-cap-squad',
    name: 'Upload Cap Increase (1 GB) — Squad',
    description:
      "Increase your squad's max single-file upload size by 1 GB per unit.",
    type: 'addon',
    defaultPriceCents: 25, // $0.25/GB/month
    billingInterval: 'month',
    storageQuotaGB: null,
    uploadSizeCapMB: 1024, // +1 GB per unit
    customDomainsLimit: null,
    features: [
      '+1 GB squad upload cap per unit',
      'Monthly or yearly billing',
      'Cancel anytime',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'storage-bucket-archival',
    name: 'Object Storage — Archival',
    description:
      'Ultra low-cost S3-compatible bucket for infrequent access. Ideal for backups, archives, and cold data with lifecycle policy support.',
    type: 'addon',
    defaultPriceCents: 800, // $8/month
    billingInterval: 'month',
    storageQuotaGB: null,
    uploadSizeCapMB: null,
    customDomainsLimit: null,
    features: [
      'Your own dedicated S3-compatible storage bucket',
      '1 TB archived + 100 GB unarchived + 1 TB bandwidth',
      'Lifecycle policy support for automatic data management',
      'Removes ALL storage quotas while active',
      'Removes ALL upload size limits while active',
      'Custom S3 endpoint & path-style support',
      '$8/month or $48/year',
      '⚠️ Bucket setup takes 12–24 hours after purchase',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'storage-bucket-standard',
    name: 'Object Storage — Standard',
    description:
      'General-purpose S3-compatible bucket with HDD+SSD indexed storage. Great for bulk storage, media, and everyday workloads.',
    type: 'addon',
    defaultPriceCents: 2000, // $20/month
    billingInterval: 'month',
    storageQuotaGB: null,
    uploadSizeCapMB: null,
    customDomainsLimit: null,
    features: [
      'Your own dedicated S3-compatible storage bucket',
      '1 TB storage + 1 TB bandwidth included',
      '800 IOPS / 600 Mbps throughput',
      'Removes ALL storage quotas while active',
      'Removes ALL upload size limits while active',
      'Custom S3 endpoint & path-style support',
      '$20/month or $120/year',
      '⚠️ Bucket setup takes 12–24 hours after purchase',
    ],
    active: true,
    popular: true,
  },
  {
    slug: 'storage-bucket-premium',
    name: 'Object Storage — Premium',
    description:
      'HDD+SSD indexed storage with higher IOPS for mixed read/write workloads. A step up from Standard for production apps.',
    type: 'addon',
    defaultPriceCents: 4000, // $40/month
    billingInterval: 'month',
    storageQuotaGB: null,
    uploadSizeCapMB: null,
    customDomainsLimit: null,
    features: [
      'Your own dedicated S3-compatible storage bucket',
      '1 TB storage + 1 TB bandwidth included',
      '1,000 IOPS / 800 Mbps throughput',
      'Removes ALL storage quotas while active',
      'Removes ALL upload size limits while active',
      'Custom S3 endpoint & path-style support',
      '$40/month or $240/year',
      '⚠️ Bucket setup takes 12–24 hours after purchase',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'storage-bucket-performance',
    name: 'Object Storage — Performance',
    description:
      'Low-latency NVMe storage for datacenter-grade workloads. High IOPS and throughput for demanding applications.',
    type: 'addon',
    defaultPriceCents: 5500, // $55/month
    billingInterval: 'month',
    storageQuotaGB: null,
    uploadSizeCapMB: null,
    customDomainsLimit: null,
    features: [
      'Your own dedicated S3-compatible storage bucket',
      'NVMe storage + 1 TB bandwidth included',
      '4,000 IOPS / 1 Gbps throughput',
      'Removes ALL storage quotas while active',
      'Removes ALL upload size limits while active',
      'Custom S3 endpoint & path-style support',
      '$55/month or $330/year',
      '⚠️ Bucket setup takes 12–24 hours after purchase',
    ],
    active: true,
    popular: false,
  },
  {
    slug: 'storage-bucket-accelerated',
    name: 'Object Storage — Accelerated',
    description:
      'High-performance NVMe for write-intensive workloads. Extreme IOPS and bandwidth for the most demanding use cases.',
    type: 'addon',
    defaultPriceCents: 11000, // $110/month
    billingInterval: 'month',
    storageQuotaGB: null,
    uploadSizeCapMB: null,
    customDomainsLimit: null,
    features: [
      'Your own dedicated S3-compatible storage bucket',
      'NVMe storage + 5 TB bandwidth included',
      '10,000 IOPS / 5 Gbps throughput',
      'Removes ALL storage quotas while active',
      'Removes ALL upload size limits while active',
      'Custom S3 endpoint & path-style support',
      '$110/month or $660/year',
      '⚠️ Bucket setup takes 12–24 hours after purchase',
    ],
    active: true,
    popular: false,
  },
]

export function catalog(): PlanSeed[] {
  return [...EMBERLY_PLANS, ...NEXIUM_PLANS, ...ADDON_PLANS]
}

export async function syncCatalog(onProduct?: (product: Product) => void) {
  for (const plan of catalog()) {
    const result = await prisma.product.upsert({
      where: { slug: plan.slug },
      create: plan,
      update: {
        name: plan.name,
        description: plan.description,
        ...(plan.defaultPriceCents !== null && {
          defaultPriceCents: plan.defaultPriceCents,
        }),
        billingInterval: plan.billingInterval,
        storageQuotaGB: plan.storageQuotaGB,
        uploadSizeCapMB: plan.uploadSizeCapMB,
        customDomainsLimit: plan.customDomainsLimit,
        features: plan.features,
        active: plan.active,
        popular: plan.popular,
      },
    })

    const stripeIds = await syncProductToStripe(result)
    const changed =
      stripeIds.stripeProductId !== result.stripeProductId ||
      stripeIds.stripePriceMonthlyId !== result.stripePriceMonthlyId ||
      stripeIds.stripePriceYearlyId !== result.stripePriceYearlyId ||
      stripeIds.stripePriceOneTimeId !== result.stripePriceOneTimeId
    const product = changed
      ? await prisma.product.update({
          where: { id: result.id },
          data: stripeIds,
        })
      : result
    onProduct?.(product)
  }
}
