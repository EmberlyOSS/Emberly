'use client'

import Link from 'next/link'
import { Icons } from '@/packages/components/shared/icons'
import { Button } from '@/packages/components/ui/button'

interface PasswordBreachWarningProps {
  occurrences: number
  onDismiss: () => void
  onProceed: () => void
}

export function PasswordBreachWarning({
  occurrences,
  onDismiss,
  onProceed,
}: PasswordBreachWarningProps) {
  return (
    <div className="space-y-4 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 dark:bg-yellow-500/10">
      <div className="flex gap-3">
        <Icons.alertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
            Password Found in Data Breach
          </h3>
          <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
            <p>
              This password appears in {occurrences === 1 ? '1 data breach' : `${occurrences} data breaches`}.
              {' '}
              <strong>This is not an Emberly security breach</strong> — it means this password has been
              compromised in other services.
            </p>
            <p className="text-xs">
              We recommend changing this password to something unique.{' '}
              <Link
                href="https://haveibeenpwned.com/Passwords"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-yellow-700 dark:hover:text-yellow-300"
              >
                Learn more
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDismiss}
          className="flex-1"
        >
          Change Password
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onProceed}
          className="flex-1"
        >
          Continue Anyway
        </Button>
      </div>
    </div>
  )
}
