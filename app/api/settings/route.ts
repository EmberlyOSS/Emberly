import {
  PublicSettings,
  SettingsUpdateResponse,
  UpdateSettingSectionRequest,
} from '@/packages/types/dto/settings'

import { HTTP_STATUS, apiError, apiResponse } from '@/packages/lib/api/response'
import { requireAdmin, requireAuth } from '@/packages/lib/auth/api-auth'
import {
  EmberlyConfig,
  getConfig,
  updateConfig,
  updateConfigSection,
} from '@/packages/lib/config'
import { loggers } from '@/packages/lib/logger'
import { invalidateStorageProvider } from '@/packages/lib/storage'

const logger = loggers.config

export async function GET(req: Request) {
  try {
    const { user, response } = await requireAuth(req)
    if (response) {
      const config = await getConfig()
      const publicSettings: PublicSettings = {
        version: config.version,
        settings: {
          general: {
            registrations: {
              enabled: config.settings.general.registrations.enabled,
              disabledMessage:
                config.settings.general.registrations.disabledMessage,
            },
          },
          appearance: {
            theme: config.settings.appearance.theme,
            favicon: config.settings.appearance.favicon,
            customColors: config.settings.appearance.customColors,
          },
          advanced: {
            customCSS: config.settings.advanced.customCSS,
            customHead: config.settings.advanced.customHead,
          },
        },
      }
      return apiResponse<PublicSettings>(publicSettings)
    }

    const config = await getConfig()

    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      const publicSettings: PublicSettings = {
        version: config.version,
        settings: {
          general: {
            registrations: {
              enabled: config.settings.general.registrations.enabled,
              disabledMessage:
                config.settings.general.registrations.disabledMessage,
            },
          },
          appearance: {
            theme: config.settings.appearance.theme,
            favicon: config.settings.appearance.favicon,
            customColors: config.settings.appearance.customColors,
          },
          advanced: {
            customCSS: config.settings.advanced.customCSS,
            customHead: config.settings.advanced.customHead,
          },
        },
      }
      return apiResponse<PublicSettings>(publicSettings)
    }

    return apiResponse<EmberlyConfig>(config)
  } catch (error) {
    logger.error('Failed to get config', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

type SettingSection = keyof EmberlyConfig['settings']

export async function PATCH(request: Request) {
  try {
    const { response } = await requireAdmin()
    if (response) return response

    const body = await request.json()
    const { section, data } =
      body as UpdateSettingSectionRequest<SettingSection>

    const config = await getConfig()

    if (section === 'appearance' && 'customColors' in data) {
      const customColors = data.customColors
      if (customColors) {
        let cssContent = config.settings.advanced.customCSS

        cssContent = cssContent.replace(/:root\s*{[^}]*}/, '')

        const cssVars = Object.entries(customColors)
          .map(
            ([key, value]) =>
              `  --${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${value};`
          )
          .join('\n')

        const newCssVars = `:root {\n${cssVars}\n}\n\n`
        config.settings.advanced.customCSS = newCssVars + cssContent
      }
    }

    await updateConfigSection(section, data)
    const updatedConfig = await getConfig()
    return apiResponse<EmberlyConfig>(updatedConfig)
  } catch (error) {
    logger.error('Failed to update config', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export async function POST(req: Request) {
  try {
    const { response } = await requireAdmin()
    if (response) return response

    const config: EmberlyConfig = await req.json()

    if (config.settings.advanced.customCSS) {
      config.settings.advanced.customCSS = config.settings.advanced.customCSS
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }

    await updateConfig(config)

    if (config.settings?.general?.storage) {
      invalidateStorageProvider()
    }

    const responseData: SettingsUpdateResponse = {
      message: 'Settings updated successfully',
    }

    return apiResponse<SettingsUpdateResponse>(responseData)
  } catch (error) {
    logger.error('Error updating settings', error as Error)
    return apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}
