'use client'

import { createContext, useContext } from 'react'

import type { Features } from '@/lib/features'

const FeaturesContext = createContext<Features>({
  cloud: false,
  billing: false,
  squads: false,
  discovery: false,
  customDomains: false,
  managedStorage: false,
  perks: false,
  storageFromEnv: false,
  whiteLabel: false,
  licenseVendor: false,
})

export function FeaturesProvider({
  features,
  children,
}: {
  features: Features
  children: React.ReactNode
}) {
  return (
    <FeaturesContext.Provider value={features}>
      {children}
    </FeaturesContext.Provider>
  )
}

export function useFeatures() {
  return useContext(FeaturesContext)
}
