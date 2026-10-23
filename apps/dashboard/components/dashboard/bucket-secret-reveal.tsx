'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function BucketSecretReveal({ secret }: { secret: string }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1 py-3 border-b border-border/40 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Secret Access Key
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-foreground break-all flex-1">
          {visible ? secret : '••••••••••••••••••••••••••••••••'}
        </span>
        <button
          onClick={() => setVisible((v) => !v)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={visible ? 'Hide secret key' : 'Reveal secret key'}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}
