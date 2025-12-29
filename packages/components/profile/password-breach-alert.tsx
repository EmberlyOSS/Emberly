'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/packages/components/ui/alert'
import { Button } from '@/packages/components/ui/button'

interface PasswordBreachAlertProps {
  passwordBreachDetectedAt?: string | null
}

export function PasswordBreachAlert({ passwordBreachDetectedAt }: PasswordBreachAlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (!passwordBreachDetectedAt || dismissed) {
    return null
  }

  const detectedDate = new Date(passwordBreachDetectedAt)
  const formattedDate = detectedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Alert variant="destructive" className="border-red-500/50 bg-red-500/5">
      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <AlertTitle className="text-red-800 dark:text-red-300">Password Breach Detected</AlertTitle>
      <AlertDescription className="mt-3 space-y-3 text-red-700 dark:text-red-200">
        <p>
          Your password has been detected in a data breach. This detection was flagged when you logged in on{' '}
          <strong>{formattedDate}</strong>.
        </p>
        <p>
          For your security, we recommend changing your password immediately to a unique, strong password you haven't used anywhere else.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDismissed(true)}
          className="mt-2 border-red-300 hover:bg-red-500/10"
        >
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  )
}
