'use client'

import { createContext, useContext } from 'react'

const BillingContext = createContext(false)

export function BillingProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  return (
    <BillingContext.Provider value={enabled}>
      {children}
    </BillingContext.Provider>
  )
}

/**
 * Whether payments are offered (cloud mode with billing switched on).
 * When false, hide every price, upgrade prompt and plan name.
 */
export function useBillingEnabled(): boolean {
  return useContext(BillingContext)
}
