import { getConfig } from '@/lib/config'
import { appUrl } from '@/lib/config/env'
import { getFeatures } from '@/lib/features'

export interface Branding {
  name: string
  embedName: string
  logo: string | null
  showCredit: boolean
}

export async function getBranding(): Promise<Branding> {
  const [config, features] = await Promise.all([getConfig(), getFeatures()])
  const name = config.settings.general.siteName?.trim() || 'Emberly'
  const whiteLabel = features.whiteLabel

  return {
    name,
    embedName: whiteLabel ? name : 'Emberly',
    logo: whiteLabel ? (config.settings.appearance.logo ?? null) : null,
    showCredit: !whiteLabel,
  }
}

const INSTANCE_LINK =
  /https:\/\/embrly\.ca(?!\/(?:contact|legal|applications|nexium))(?=["'/?\s)]|$)/g

export async function getEmailBrander() {
  const [{ embedName }, features] = await Promise.all([
    getBranding(),
    getFeatures(),
  ])
  const instanceUrl = appUrl()
  return <T extends string | undefined>(value: T): T => {
    if (!value) return value
    let out: string = value
    if (!features.cloud) out = out.replace(INSTANCE_LINK, instanceUrl)
    if (embedName !== 'Emberly') out = out.replace(/\bEmberly\b/g, embedName)
    return out as T
  }
}
