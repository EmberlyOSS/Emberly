'use client'

import { useEffect } from 'react'

import { usePathname, useRouter } from 'next/navigation'

import {
  useSetupStatus,
  useSetupStatusMutations,
} from '@/hooks/use-setup-status'

interface SetupCheckerProps {
  children: React.ReactNode
}

export function SetupChecker({ children }: SetupCheckerProps) {
  const router = useRouter()
  const pathname = usePathname()

  const shouldCheckSetup = !pathname.startsWith('/api/')

  const {
    data: setupStatus,
    isLoading,
    error,
  } = useSetupStatus(shouldCheckSetup)
  const { updateSetupStatus } = useSetupStatusMutations()

  useEffect(() => {
    const handleSetupCompleted = (event: CustomEvent) => {
      updateSetupStatus(event.detail.completed)
    }

    const handleSetupIncomplete = (event: CustomEvent) => {
      updateSetupStatus(event.detail.completed)
    }

    window.addEventListener(
      'setup-completed',
      handleSetupCompleted as EventListener
    )
    window.addEventListener(
      'setup-incomplete',
      handleSetupIncomplete as EventListener
    )

    return () => {
      window.removeEventListener(
        'setup-completed',
        handleSetupCompleted as EventListener
      )
      window.removeEventListener(
        'setup-incomplete',
        handleSetupIncomplete as EventListener
      )
    }
  }, [updateSetupStatus])

  useEffect(() => {
    if (isLoading || !shouldCheckSetup) return

    // A failed check (DB/network hiccup) says nothing about setup state, so
    // don't bounce an already-configured instance to /setup over it
    if (error) {
      console.error('Setup check failed:', error)
      return
    }

    if (setupStatus) {
      if (!setupStatus.completed && !pathname.startsWith('/setup')) {
        router.push('/setup')
        return
      }

      if (setupStatus.completed && pathname.startsWith('/setup')) {
        router.push('/dashboard')
        return
      }
    }
  }, [setupStatus, isLoading, error, pathname, router, shouldCheckSetup])

  if (isLoading && shouldCheckSetup) {
    return null
  }

  return <>{children}</>
}
