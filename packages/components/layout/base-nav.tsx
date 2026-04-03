'use client'

import { NavContent } from '@/packages/components/layout/nav'

export function BaseNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 pt-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative glass-elevated rounded-2xl gradient-border-animated transition-all duration-300">
          <div className="relative">
            <NavContent logoHref="/" />
          </div>
        </div>
      </div>
    </header>
  )
}

export default BaseNav