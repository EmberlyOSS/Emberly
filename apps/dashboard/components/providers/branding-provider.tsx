'use client'

import { createContext, useContext } from 'react'

import type { Branding } from '@/lib/branding'

const BrandingContext = createContext<Branding>({
  name: 'Emberly',
  embedName: 'Emberly',
  logo: null,
  showCredit: true,
})

export function BrandingProvider({
  branding,
  children,
}: {
  branding: Branding
  children: React.ReactNode
}) {
  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  return useContext(BrandingContext)
}
