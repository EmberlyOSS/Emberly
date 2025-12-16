'use client'

import { useRef, useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { ProfileSecurityProps } from '@/types/components/profile'
import { useSession } from 'next-auth/react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useToast } from '@/hooks/use-toast'

export function ProfileSecurity({ onUpdate }: ProfileSecurityProps) {
  const { update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null)
  const [showEnablePanel, setShowEnablePanel] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [setupSecret, setSetupSecret] = useState<string | null>(null)
  const [setupToken, setSetupToken] = useState('')
  const [disableToken, setDisableToken] = useState('')
  const { toast } = useToast()
  const router = useRouter()

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

  const handleAccountDeletion = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      toast({
        title: 'Success',
        description: 'Account deleted successfully',
      })

      router.push('/auth/login')
    } catch (error) {
      console.error('Account deletion error:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res = await fetch('/api/profile')
          if (!res.ok) return
          const data = await res.json()
          if (mounted) setTwoFactorEnabled(!!data.twoFactorEnabled)
        } catch (e) {
          // noop
        }
      })()
    return () => {
      mounted = false
    }
  }, [])

  const startEnable2FA = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/profile/2fa')
      if (!res.ok) throw new Error('Failed to get 2FA secret')
      const data = await res.json()
      setQrDataUrl(data.qrDataUrl)
      setSetupSecret(data.secret)
      setShowEnablePanel(true)
    } catch (error) {
      console.error('2FA start error', error)
      toast({ title: 'Error', description: 'Failed to start 2FA setup', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const confirmEnable2FA = async () => {
    if (!setupSecret || !setupToken) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/profile/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: setupSecret, token: setupToken }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to enable 2FA')
      }
      setTwoFactorEnabled(true)
      setShowEnablePanel(false)
      setSetupSecret(null)
      setSetupToken('')
      toast({ title: 'Success', description: 'Two-factor authentication enabled' })
      onUpdate()
    } catch (error) {
      console.error('Enable 2FA error', error)
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to enable 2FA', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const disable2FA = async () => {
    if (!disableToken) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/profile/2fa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: disableToken }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to disable 2FA')
      }
      setTwoFactorEnabled(false)
      setDisableToken('')
      toast({ title: 'Success', description: 'Two-factor authentication disabled' })
      onUpdate()
    } catch (error) {
      console.error('Disable 2FA error', error)
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to disable 2FA', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Password Management</h3>
        <p className="text-sm text-muted-foreground">
          Update your password to keep your account secure.
        </p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              ref={currentPasswordRef}
              placeholder="Enter your current password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              ref={newPasswordRef}
              placeholder="Enter your new password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              ref={confirmPasswordRef}
              placeholder="Confirm your new password"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </form>

      <div className="border-t pt-6 mt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account using an authenticator app.
          </p>

          <div className="relative mt-2">
            <div className="rounded-md border bg-card/50 p-6 pointer-events-none select-none blur-sm opacity-60">
              <div className="h-36 w-full" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-md bg-background/80 px-4 py-2 text-sm font-medium">Coming soon!!!</div>
            </div>
          </div>
        </div>
        <div className="space-y-2 mt-8">
          <h3 className="text-lg font-semibold text-destructive">
            Delete Account
          </h3>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and remove all associated data.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleAccountDeletion}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
