'use client'

import { useBranding } from '@/components/providers/branding-provider'

import { EmberlyIcon } from './emberly-icon'

export function BrandLogo({
  className = '',
  ...props
}: React.SVGProps<SVGSVGElement> & { className?: string }) {
  const { logo, name } = useBranding()
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className={`h-6 w-6 object-contain ${className}`}
      />
    )
  }
  return <EmberlyIcon className={className} {...props} />
}

export function BrandName() {
  return <>{useBranding().name}</>
}

export function PoweredByEmberly({ className = '' }: { className?: string }) {
  if (!useBranding().showCredit) return null
  return (
    <a
      href="https://embrly.ca"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      <EmberlyIcon className="h-3.5 w-3.5" />
      Powered by Emberly
    </a>
  )
}
