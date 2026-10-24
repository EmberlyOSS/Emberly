'use client'

import { useRef, useState, useEffect } from 'react'

import { ProfileSecurityProps } from '@/types/components/profile'
import { useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useToast } from '@/hooks/use-toast'
import { DevicesList } from './devices-list'
import { LoginHistory } from './login-history'
import { RecoveryCodesManager } from './recovery-codes-manager'
import { DisableTwoFactorSetup, EnableTwoFactorSetup } from './two-factor-setup'

export function ProfileSecurity({ onUpdate }: ProfileSecurityProps) {
  const { update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null)
  const [showEnablePanel, setShowEnablePanel] = useState(false)
  const [showDisablePanel, setShowDisablePanel] = useState(false)
  const [checkingTwoFactor, setCheckingTwoFactor] = useState(true)
  const { toast } = useToast()

  const currentPasswordRef = useRef<HTMLInputElement>(null)
  const newPasswordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPasswordRef.current?.value !== confirmPasswordRef.current?.value) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: currentPasswordRef.current?.value,
          newPassword: newPasswordRef.current?.value,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update password')
      }

      await updateSession()

      onUpdate()

      toast({
        title: 'Success',
        description: 'Password updated successfully',
      })

      if (currentPasswordRef.current) currentPasswordRef.current.value = ''
      if (newPasswordRef.current) newPasswordRef.current.value = ''
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = ''
    } catch (error) {
      console.error('Password update error:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update password',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setCheckingTwoFactor(true)
        const res = await fetch('/api/profile', {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) return
        const payload = await res.json()
        const data = payload?.data ?? payload
        if (mounted) setTwoFactorEnabled(!!data.twoFactorEnabled)
      } catch (e) {
        // noop
      } finally {
        if (mounted) setCheckingTwoFactor(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Password</h3>
        <p className="text-sm text-muted-foreground">
          Change the password you sign in with.
        </p>
      </div>

      <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              ref={currentPasswordRef}
              placeholder="Enter your current password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              ref={newPasswordRef}
              placeholder="Enter your new password"
              minLength={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              ref={confirmPasswordRef}
              placeholder="Confirm your new password"
              minLength={8}
              required
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Updating…' : 'Update password'}
        </Button>
      </form>

      <div className="border-t pt-6 mt-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">Two-factor authentication</h3>
            {!checkingTwoFactor && (
              <span
                className={
                  twoFactorEnabled
                    ? 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500'
                    : 'rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground'
                }
              >
                {twoFactorEnabled ? 'On' : 'Off'}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {twoFactorEnabled
              ? 'Signing in asks for a code from your authenticator app.'
              : 'Ask for a code from an authenticator app when you sign in.'}
          </p>

          {!showEnablePanel && !showDisablePanel && (
            <div className="mt-4">
              {checkingTwoFactor ? (
                <Button disabled>Checking…</Button>
              ) : twoFactorEnabled ? (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDisablePanel(true)}
                >
                  Turn off 2FA
                </Button>
              ) : (
                <Button onClick={() => setShowEnablePanel(true)}>
                  Turn on 2FA
                </Button>
              )}
            </div>
          )}

          {showEnablePanel && (
            <EnableTwoFactorSetup
              onCancel={() => setShowEnablePanel(false)}
              onEnabled={() => {
                setTwoFactorEnabled(true)
                setShowEnablePanel(false)
                onUpdate()
              }}
            />
          )}

          {showDisablePanel && (
            <DisableTwoFactorSetup
              onCancel={() => setShowDisablePanel(false)}
              onDisabled={() => {
                setTwoFactorEnabled(false)
                setShowDisablePanel(false)
                onUpdate()
              }}
            />
          )}
        </div>

        {twoFactorEnabled && (
          <div className="border-t pt-6 mt-6">
            <RecoveryCodesManager />
          </div>
        )}

        <div className="border-t pt-6 mt-6">
          <DevicesList />
        </div>

        <div className="border-t pt-6 mt-6">
          <LoginHistory />
        </div>
      </div>
    </div>
  )
}
