import { Prisma } from '@/prisma/generated/prisma/client'
import { z } from 'zod'

import { configCache } from '@/packages/lib/cache/config-cache'
import { prisma } from '@/packages/lib/database/prisma'
import { isCloudEnabled } from '@/packages/lib/config/env'
import { loggers } from '@/packages/lib/logger'

const logger = loggers.config

export const configSchema = z
  .object({
    version: z.string().optional().default('1.0.0'),
    settings: z
      .object({
        general: z
          .object({
            siteName: z.string().optional().default('Emberly'),
            metaDescription: z.string().optional().default(''),
            setup: z
              .object({
                completed: z.boolean().optional().default(false),
                // Store as ISO string for JSON compatibility, not Date object
                completedAt: z
                  .any()
                  .nullable()
                  .optional()
                  .default(null)
                  .transform((val) => {
                    if (!val) return null
                    // If it's already a valid ISO string, keep it
                    if (typeof val === 'string') {
                      const d = new Date(val)
                      return isNaN(d.getTime()) ? null : val
                    }
                    // If it's a Date object, convert to ISO string
                    if (val instanceof Date) {
                      return isNaN(val.getTime()) ? null : val.toISOString()
                    }
                    // Handle JSON-parsed objects with a valid date property
                    if (Object(val) === val && typeof val === 'object') {
                      try {
                        const d = new Date(val)
                        return isNaN(d.getTime()) ? null : d.toISOString()
                      } catch {
                        return null
                      }
                    }
                    return null
                  }),
              })
              .passthrough()
              .optional()
              .default({ completed: false, completedAt: null }),
            registrations: z
              .object({
                enabled: z.boolean().optional().default(true),
                disabledMessage: z.string().optional().default(''),
              })
              .passthrough()
              .optional()
              .default({ enabled: true, disabledMessage: '' }),
            billing: z
              .object({
                enabled: z.boolean().optional().default(true),
              })
              .passthrough()
              .optional()
              .default({ enabled: true }),
            storage: z
              .object({
                provider: z.enum(['local', 's3']).optional().default('local'),
                s3: z
                  .object({
                    bucket: z.string().optional().default(''),
                    region: z.string().optional().default(''),
                    accessKeyId: z.string().optional().default(''),
                    secretAccessKey: z.string().optional().default(''),
                    endpoint: z.string().optional(),
                    forcePathStyle: z.boolean().optional().default(false),
                  })
                  .passthrough()
                  .optional()
                  .default({}),
                quotas: z
                  .object({
                    enabled: z.boolean().optional().default(false),
                    default: z
                      .object({
                        value: z.number().optional().default(10),
                        unit: z.string().optional().default('GB'),
                      })
                      .passthrough()
                      .optional()
                      .default({ value: 10, unit: 'GB' }),
                  })
                  .passthrough()
                  .optional()
                  .default({
                    enabled: false,
                    default: { value: 10, unit: 'GB' },
                  }),
                maxUploadSize: z
                  .object({
                    value: z.number().optional().default(100),
                    unit: z.string().optional().default('MB'),
                  })
                  .passthrough()
                  .optional()
                  .default({ value: 100, unit: 'MB' }),
              })
              .passthrough()
              .optional()
              .default({}),
            credits: z
              .object({
                showFooter: z.boolean().optional().default(true),
              })
              .passthrough()
              .optional()
              .default({ showFooter: true }),
            ocr: z
              .object({
                enabled: z.boolean().optional().default(true),
              })
              .passthrough()
              .optional()
              .default({ enabled: true }),
          })
          .passthrough()
          .optional()
          .default({}),
        appearance: z
          .object({
            theme: z.string().optional().default('default-dark'),
            themeType: z
              .enum(['static', 'animated', 'gaming'])
              .optional()
              .default('static'),
            backgroundEffect: z
              .enum([
                'none',
                'particles',
                'gradient-shift',
                'waves',
                'glitch',
                'grid',
                'parallax',
                'aurora',
                'stars',
                'matrix',
              ])
              .optional()
              .default('none'),
            animationSpeed: z
              .enum(['slow', 'medium', 'fast'])
              .optional()
              .default('medium'),
            enableAnimations: z.boolean().optional().default(false),
            enableBackgroundEffect: z.boolean().optional().default(false),
            favicon: z.string().nullable().optional().default(null),
            customColors: z.record(z.string()).optional().default({}),
            systemThemes: z.record(z.any()).optional().default({}),
          })
          .passthrough()
          .optional()
          .default({}),
        advanced: z
          .object({
            customCSS: z.string().optional().default(''),
            customHead: z.string().optional().default(''),
          })
          .passthrough()
          .optional()
          .default({ customCSS: '', customHead: '' }),
        integrations: z
          .object({
            cloudflare: z
              .object({
                apiToken: z.string().optional().default(''),
                accountId: z.string().optional().default(''),
                zoneId: z.string().optional().default(''),
              })
              .passthrough()
              .optional()
              .default({}),
            discord: z
              .object({
                webhookUrl: z.string().optional().default(''),
                botToken: z.string().optional().default(''),
                serverId: z.string().optional().default(''),
                supporterRole: z.string().optional().default(''),
              })
              .passthrough()
              .optional()
              .default({}),
            github: z
              .object({
                org: z.string().optional().default('EmberlyOSS'),
                pat: z.string().optional().default(''),
              })
              .passthrough()
              .optional()
              .default({}),
            stripe: z
              .object({
                secretKey: z.string().optional().default(''),
                webhookSecret: z.string().optional().default(''),
              })
              .passthrough()
              .optional()
              .default({}),
            vultr: z
              .object({
                apiKey: z.string().optional().default(''),
              })
              .passthrough()
              .optional()
              .default({}),
            linode: z
              .object({
                apiKey: z.string().optional().default(''),
              })
              .passthrough()
              .optional()
              .default({}),
            ovhcloud: z
              .object({
                appKey: z.string().optional().default(''),
                appSecret: z.string().optional().default(''),
                consumerKey: z.string().optional().default(''),
                endpoint: z.string().optional().default('ovh-eu'),
              })
              .passthrough()
              .optional()
              .default({}),
            resend: z
              .object({
                apiKey: z.string().optional().default(''),
                emailFrom: z.string().optional().default(''),
              })
              .passthrough()
              .optional()
              .default({}),
            emailProvider: z
              .enum(['resend', 'smtp'])
              .optional()
              .default('resend'),
            smtp: z
              .object({
                host: z.string().optional().default(''),
                port: z.number().optional().default(587),
                secure: z.boolean().optional().default(false),
                user: z.string().optional().default(''),
                password: z.string().optional().default(''),
                from: z.string().optional().default(''),
              })
              .passthrough()
              .optional()
              .default({}),
          })
          .passthrough()
          .optional()
          .default({}),
      })
      .passthrough()
      .optional()
      .default({}),
  })
  .passthrough()

export type EmberlyConfig = z.infer<typeof configSchema>

export const DEFAULT_CONFIG: EmberlyConfig = {
  version: '1.0.0',
  settings: {
    general: {
      siteName: 'Emberly',
      metaDescription: '',
      setup: {
        completed: false,
        completedAt: null,
      },
      registrations: {
        enabled: true,
        disabledMessage: '',
      },
      billing: {
        enabled: true,
      },
      storage: {
        provider: 'local',
        s3: {
          bucket: '',
          region: '',
          accessKeyId: '',
          secretAccessKey: '',
          endpoint: '',
          forcePathStyle: false,
        },
        quotas: {
          enabled: false,
          default: {
            value: 10,
            unit: 'GB',
          },
        },
        maxUploadSize: {
          value: 100,
          unit: 'MB',
        },
      },
      credits: {
        showFooter: true,
      },
      ocr: {
        enabled: true,
      },
    },
    appearance: {
      theme: 'default-dark',
      themeType: 'static',
      backgroundEffect: 'none',
      animationSpeed: 'medium',
      enableAnimations: false,
      enableBackgroundEffect: false,
      favicon: null,
      customColors: {
        background: '20 14% 4%',
        foreground: '30 20% 96%',
        card: '20 12% 6.5%',
        cardForeground: '30 20% 96%',
        popover: '20 12% 7%',
        popoverForeground: '30 20% 96%',
        primary: '24.6 95% 53.1%',
        primaryForeground: '20 30% 8%',
        secondary: '20 10% 13%',
        secondaryForeground: '30 20% 96%',
        muted: '20 10% 13%',
        mutedForeground: '25 8% 64%',
        accent: '20 10% 14%',
        accentForeground: '30 20% 96%',
        destructive: '0 72% 51%',
        destructiveForeground: '0 0% 98%',
        border: '20 9% 15%',
        input: '20 9% 17%',
        ring: '24.6 95% 53.1%',
      },
      systemThemes: {},
    },
    advanced: {
      customCSS: '',
      customHead: '',
    },
    integrations: {
      cloudflare: {
        apiToken: '',
        accountId: '',
        zoneId: '',
      },
      discord: {
        webhookUrl: '',
        botToken: '',
        serverId: '',
        supporterRole: '',
      },
      github: {
        org: 'EmberlyOSS',
        pat: '',
      },
      stripe: {
        secretKey: '',
        webhookSecret: '',
      },
      vultr: {
        apiKey: '',
      },
      linode: {
        apiKey: '',
      },
      ovhcloud: {
        appKey: '',
        appSecret: '',
        consumerKey: '',
        endpoint: 'ovh-eu',
      },
      resend: {
        apiKey: '',
        emailFrom: '',
      },
      emailProvider: 'resend' as 'resend' | 'smtp',
      smtp: {
        host: '',
        port: 587,
        secure: false,
        user: '',
        password: '',
        from: '',
      },
    },
  },
}

export async function initConfig(): Promise<EmberlyConfig> {
  try {
    let configRow
    try {
      configRow = await prisma.config.upsert({
        where: { key: 'site_config' },
        update: {}, // Don't update if it exists
        create: {
          key: 'site_config',
          value: DEFAULT_CONFIG as Prisma.InputJsonValue,
        },
      })
    } catch (error) {
      // Prisma's upsert is select-then-insert, so concurrent first requests
      // race on the unique key; the loser just reads the row the winner made
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      ) {
        throw error
      }
      configRow = await prisma.config.findUniqueOrThrow({
        where: { key: 'site_config' },
      })
    }

    // Use safeParse and merge - never fail
    const parsed = configSchema.safeParse(configRow.value)
    return parsed.success
      ? deepMerge(DEFAULT_CONFIG, parsed.data)
      : deepMerge(DEFAULT_CONFIG, configRow.value as any)
  } catch (error) {
    logger.warn('Could not access database for config, using default', {
      error: error instanceof Error ? error.message : String(error),
    })
    return DEFAULT_CONFIG
  }
}

/**
 * Deep merge two objects, with source taking priority
 */
function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target }
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(
          target[key] ?? ({} as T[Extract<keyof T, string>]),
          source[key] as T[Extract<keyof T, string>]
        )
      } else {
        result[key] = source[key] as T[Extract<keyof T, string>]
      }
    }
  }
  return result
}

export async function getConfig(): Promise<EmberlyConfig> {
  try {
    // Try Redis cache first
    const cached = await configCache.getConfig<EmberlyConfig>()
    if (cached) {
      // Merge with defaults to fill any missing fields
      const parsed = configSchema.safeParse(cached)
      if (parsed.success) {
        return deepMerge(DEFAULT_CONFIG, parsed.data)
      }
    }

    // Cache miss - fetch from database
    const configRow = await prisma.config.findFirst()

    if (!configRow) return initConfig()

    // Use safeParse and merge with defaults - never fail
    const parsed = configSchema.safeParse(configRow.value)
    const config = parsed.success
      ? deepMerge(DEFAULT_CONFIG, parsed.data)
      : deepMerge(DEFAULT_CONFIG, configRow.value as any)

    // Cache the result
    await configCache.setConfig(config)

    return config
  } catch (error) {
    logger.warn('Could not access database for config, using default', {
      error: error instanceof Error ? error.message : String(error),
    })
    return DEFAULT_CONFIG
  }
}

export async function updateConfig(
  newConfig: Partial<EmberlyConfig>
): Promise<EmberlyConfig> {
  try {
    const currentConfig = await getConfig()
    const mergedConfig = {
      ...currentConfig,
      ...newConfig,
      settings: {
        ...currentConfig.settings,
        ...(newConfig.settings || {}),
        general: {
          ...currentConfig.settings.general,
          ...(newConfig.settings?.general || {}),
          setup: {
            ...currentConfig.settings.general.setup,
            ...(newConfig.settings?.general?.setup || {}),
          },
          registrations: {
            ...currentConfig.settings.general.registrations,
            ...(newConfig.settings?.general?.registrations || {}),
          },
          billing: {
            ...currentConfig.settings.general.billing,
            ...(newConfig.settings?.general?.billing || {}),
          },
          storage: {
            ...currentConfig.settings.general.storage,
            ...(newConfig.settings?.general?.storage || {}),
            quotas: {
              ...currentConfig.settings.general.storage.quotas,
              ...(newConfig.settings?.general?.storage?.quotas || {}),
              default: {
                ...currentConfig.settings.general.storage.quotas.default,
                ...(newConfig.settings?.general?.storage?.quotas?.default ||
                  {}),
              },
            },
            maxUploadSize: {
              ...currentConfig.settings.general.storage.maxUploadSize,
              ...(newConfig.settings?.general?.storage?.maxUploadSize || {}),
            },
          },
          credits: {
            ...currentConfig.settings.general.credits,
            ...(newConfig.settings?.general?.credits || {}),
          },
          ocr: {
            ...currentConfig.settings.general.ocr,
            ...(newConfig.settings?.general?.ocr || {}),
          },
        },
        appearance: {
          ...currentConfig.settings.appearance,
          ...(newConfig.settings?.appearance || {}),
          customColors: {
            ...currentConfig.settings.appearance.customColors,
            ...(newConfig.settings?.appearance?.customColors || {}),
          },
          systemThemes: {
            ...currentConfig.settings.appearance.systemThemes,
            ...(newConfig.settings?.appearance?.systemThemes || {}),
          },
        },
        advanced: {
          ...currentConfig.settings.advanced,
          ...(newConfig.settings?.advanced || {}),
        },
        integrations: {
          ...currentConfig.settings.integrations,
          ...(newConfig.settings?.integrations || {}),
          cloudflare: {
            ...currentConfig.settings.integrations?.cloudflare,
            ...(newConfig.settings?.integrations?.cloudflare || {}),
          },
          discord: {
            ...currentConfig.settings.integrations?.discord,
            ...(newConfig.settings?.integrations?.discord || {}),
          },
          github: {
            ...currentConfig.settings.integrations?.github,
            ...(newConfig.settings?.integrations?.github || {}),
          },
          stripe: {
            ...currentConfig.settings.integrations?.stripe,
            ...(newConfig.settings?.integrations?.stripe || {}),
          },
          resend: {
            ...currentConfig.settings.integrations?.resend,
            ...(newConfig.settings?.integrations?.resend || {}),
          },
        },
      },
    }

    const validatedConfig = configSchema.parse(mergedConfig)

    // Save validated config. Use findFirst -> update by id, or create if none.
    const existing = await prisma.config.findFirst()
    if (existing) {
      await prisma.config.update({
        where: { id: existing.id },
        data: { value: validatedConfig as Prisma.InputJsonValue },
      })
    } else {
      // Use upsert to handle race conditions
      await prisma.config.upsert({
        where: { key: 'site_config' },
        update: { value: validatedConfig as Prisma.InputJsonValue },
        create: {
          key: 'site_config',
          value: validatedConfig as Prisma.InputJsonValue,
        },
      })
    }

    // Invalidate cache
    await configCache.invalidateConfig()

    logger.info('Configuration updated successfully')
    return validatedConfig
  } catch (error) {
    // Log the actual error for debugging - use console.error for immediate visibility
    console.error('[CONFIG ERROR] Could not save config to database:', error)
    if (error instanceof Error) {
      console.error('[CONFIG ERROR] Message:', error.message)
      console.error('[CONFIG ERROR] Stack:', error.stack)
    }
    // Check if it's a Zod validation error
    if (error && typeof error === 'object' && 'issues' in error) {
      console.error(
        '[CONFIG ERROR] Zod issues:',
        JSON.stringify((error as any).issues, null, 2)
      )
    }
    logger.error('Could not save config to database', {
      error: error instanceof Error ? error.message : String(error),
    })
    return newConfig as EmberlyConfig
  }
}

export async function updateConfigSection<
  T extends keyof EmberlyConfig['settings'],
>(section: T, data: Partial<EmberlyConfig['settings'][T]>): Promise<void> {
  try {
    const config = await getConfig()
    const updatedConfig = {
      ...config,
      settings: {
        ...config.settings,
        [section]: {
          ...(config.settings[section] as Record<string, unknown>),
          ...(data as Record<string, unknown>),
        },
      },
    }
    await updateConfig(updatedConfig)
    logger.debug('Config section updated', { section })
  } catch (error) {
    logger.warn('Could not update config section', { section, error })
  }
}

/**
 * Returns the integrations section of the config, falling back to defaults.
 * Convenience helper for service clients.
 */
export async function getIntegrations() {
  const config = await getConfig()
  return config.settings.integrations ?? DEFAULT_CONFIG.settings.integrations!
}

/**
 * Whether payments are offered at all. Billing is a cloud-only feature, and a
 * superadmin can also switch it off on cloud to run Emberly fully free: no
 * checkout, no plan gating, and limit increases go through applications.
 * Existing subscribers keep portal access so they can still cancel.
 */
export async function isBillingEnabled(): Promise<boolean> {
  if (!isCloudEnabled()) return false
  const config = await getConfig()
  return config.settings.general.billing?.enabled !== false
}
