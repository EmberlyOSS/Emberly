"use client"

import { useRef, useState, useEffect } from "react"

import { useRouter } from "next/navigation"

import { ProfileSecurityProps } from "@/packages/types/components/profile"
import { useSession } from "next-auth/react"

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
} from "@/packages/components/ui/alert-dialog"
import { Button } from "@/packages/components/ui/button"
import { Input } from "@/packages/components/ui/input"
import { Label } from "@/packages/components/ui/label"

import { useToast } from "@/packages/hooks/use-toast"
import { QRCodeSVG } from "qrcode.react"

export function ProfileSecurity({ onUpdate }: ProfileSecurityProps) {
  const { update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null)
  const [showEnablePanel, setShowEnablePanel] = useState(false)
  const [enableStep, setEnableStep] = useState<number>(1)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [otpauth, setOtpauth] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [setupSecret, setSetupSecret] = useState<string | null>(null)
  const [setupToken, setSetupToken] = useState("")
  const [disableToken, setDisableToken] = useState("")
  const [showDisablePanel, setShowDisablePanel] = useState(false)
  const [disableStep, setDisableStep] = useState<number>(1)
  const [disablePassword, setDisablePassword] = useState("")
  const [checkingTwoFactor, setCheckingTwoFactor] = useState(true)
  const [openClicks, setOpenClicks] = useState(0)
  const { toast } = useToast()
  const router = useRouter()

  const currentPasswordRef = useRef<HTMLInputElement>(null)
  const newPasswordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPasswordRef.current?.value !== confirmPasswordRef.current?.value) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: currentPasswordRef.current?.value,
          newPassword: newPasswordRef.current?.value,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update password")
      }

      await updateSession()

      onUpdate()

      toast({
        title: "Success",
        description: "Password updated successfully",
      })

      if (currentPasswordRef.current) currentPasswordRef.current.value = ""
      if (newPasswordRef.current) newPasswordRef.current.value = ""
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = ""
    } catch (error) {
      console.error("Password update error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccountDeletion = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete account")
      }

      toast({
        title: "Success",
        description: "Account deleted successfully",
      })

      router.push("/auth/login")
    } catch (error) {
      console.error("Account deletion error:", error)
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openDisablePanel = () => {
    // debug hook for click events
    // eslint-disable-next-line no-console
    console.debug("openDisablePanel clicked")
    setOpenClicks((c) => c + 1)
    setShowDisablePanel(true)
    setDisableStep(1)
  }

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          setCheckingTwoFactor(true)
          const res = await fetch("/api/profile", { credentials: "same-origin", headers: { Accept: "application/json" } })
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

  const startEnable2FA = async () => {
    setEnableStep(1)
    setShowEnablePanel(true)
  }

  const fetch2FASecret = async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const res = await fetch("/api/profile/2fa", { credentials: "same-origin", headers: { Accept: "application/json" } })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        console.error("2FA GET non-ok response", res.status, text)
        setFetchError(`Failed to fetch 2FA secret: ${res.status} ${text || ""}`)
        return
      }
      const payload = await res.json()
      console.debug("2FA GET payload", payload)
      const data = payload?.data ?? payload
      setQrDataUrl(data?.qrDataUrl ?? null)
      setOtpauth(data?.otpauth ?? null)
      setSetupSecret(data?.secret ?? null)
    } catch (error) {
      console.error("2FA start error", error)
      setFetchError("Network error fetching 2FA secret")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (showEnablePanel && enableStep === 2) {
      fetch2FASecret()
    }
  }, [showEnablePanel, enableStep])

  const confirmEnable2FA = async () => {
    if (!setupSecret || !setupToken) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/profile/2fa", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: setupSecret, token: setupToken }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to enable 2FA")
      }
      setTwoFactorEnabled(true)
      setShowEnablePanel(false)
      setSetupSecret(null)
      setSetupToken("")
      toast({ title: "Success", description: "Two-factor authentication enabled" })
      onUpdate()
    } catch (error) {
      console.error("Enable 2FA error", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to enable 2FA", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const disable2FA = async () => {
    await performDisable2FA(disableToken, disablePassword)
  }

  const performDisable2FA = async (token: string, password?: string) => {
    if (!token || !password) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/profile/2fa", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to disable 2FA")
      }
      setTwoFactorEnabled(false)
      setDisableToken("")
      setDisablePassword("")
      setShowDisablePanel(false)
      toast({ title: "Success", description: "Two-factor authentication disabled" })
      onUpdate()
    } catch (error) {
      console.error("Disable 2FA error", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to disable 2FA", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Password Management</h3>
        <p className="text-sm text-muted-foreground">Update your password to keep your account secure.</p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" ref={currentPasswordRef} placeholder="Enter your current password" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" ref={newPasswordRef} placeholder="Enter your new password" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" ref={confirmPasswordRef} placeholder="Confirm your new password" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>{isLoading ? "Updating..." : "Update Password"}</Button>
        </div>
      </form>

      <div className="border-t pt-6 mt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">Add an extra layer of security to your account using an authenticator app.</p>

          <div className="mt-4">
            {checkingTwoFactor ? (
              <div className="space-y-3 w-full sm:w-auto">
                <div className="flex gap-2 w-full sm:w-auto"><Button disabled>Checking 2FA…</Button></div>
              </div>
            ) : twoFactorEnabled ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button type="button" variant="destructive" className="w-full sm:w-auto" onClick={openDisablePanel}>Disable 2FA</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 w-full sm:w-auto">
                <div className="flex gap-2 w-full sm:w-auto"><Button onClick={startEnable2FA}>Enable 2FA (Recommended)</Button></div>
              </div>
            )}
          </div>

          {showEnablePanel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => { setShowEnablePanel(false); setSetupSecret(null); setQrDataUrl(null); }} />
              <div className="relative w-full max-w-lg bg-background border border-border rounded-xl p-6 z-10">
                <h3 className="text-lg font-semibold mb-2">Set up Two Factor Authentication</h3>

                {enableStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Two factor authentication (2FA) provides an additional layer of security by requiring a time based code from your authenticator app when signing in.</p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      <li>Install an authenticator app (Google Authenticator, Authy, etc.).</li>
                      <li>You'll scan a QR code or paste a secret into the app.</li>
                      <li>After setup, you'll enter a code from the app to confirm.</li>
                    </ul>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setShowEnablePanel(false)}>Cancel</Button>
                      <Button onClick={async () => { setEnableStep(2); await fetch2FASecret(); }}>Next</Button>
                    </div>
                  </div>
                )}

                {enableStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Scan the QR code below with your authenticator app. If you can't scan it, copy the secret and paste it into your app.</p>
                    <div className="flex flex-col items-center gap-4 w-full">
                      <div className="flex justify-center w-full">
                        {otpauth ? (
                          <QRCodeSVG value={otpauth} size={300} bgColor="hsl(var(--foreground))" fgColor="hsl(var(--accent))" />
                        ) : qrDataUrl ? (
                          // fallback to server-generated data URL if otpauth unavailable
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={qrDataUrl} alt="2FA QR code" className="w-72 h-72 object-contain" />
                        ) : (
                          <div className="text-sm text-muted-foreground">Loading QR…</div>
                        )}
                      </div>

                      <details className="w-full border rounded-md p-3">
                        <summary className="cursor-pointer font-medium">Show secret</summary>
                        <div className="mt-2 flex gap-2 items-center">
                          <Input value={setupSecret ?? ""} readOnly />
                          <Button onClick={async () => { if (setupSecret) { await navigator.clipboard.writeText(setupSecret); toast({ title: 'Copied', description: 'Secret copied to clipboard' }); } }}>Copy</Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">If you are currently unable to scan the QR code, you can manually enter the secret into your authenticator app.</p>
                      </details>

                      <p className="text-sm text-muted-foreground mt-1">After adding the account to your app, proceed to confirmation.</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setEnableStep(1)}>Back</Button>
                      <Button onClick={() => setEnableStep(3)}>Next</Button>
                    </div>
                  </div>
                )}

                {enableStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app to complete setup.</p>
                    <Input placeholder="123456" value={setupToken} onChange={(e) => setSetupToken(e.target.value)} />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setEnableStep(2)}>Back</Button>
                      <Button onClick={confirmEnable2FA} disabled={isLoading || setupToken.length < 6}>{isLoading ? 'Verifying...' : 'Confirm & Enable'}</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {showDisablePanel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => { setShowDisablePanel(false); setDisableStep(1); setDisableToken(''); setDisablePassword(''); }} />
              <div className="relative w-full max-w-lg bg-background border border-border rounded-xl p-6 z-10">
                <h3 className="text-lg font-semibold mb-2">Disable Two Factor Authentication</h3>

                {disableStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">We do not recommend disabling two-factor authentication unless absolutely necessary. Disabling 2FA will reduce the security of your account.</p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      <li>Only disable 2FA if you have lost access to your authenticator device or need to reset configuration.</li>
                      <li>If you are unsure, consider temporarily rotating devices or recovering via backup codes instead.</li>
                    </ul>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setShowDisablePanel(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={() => setDisableStep(2)}>Proceed</Button>
                    </div>
                  </div>
                )}

                {disableStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app to confirm disabling.</p>
                    <Input placeholder="123456" value={disableToken} onChange={(e) => setDisableToken(e.target.value)} />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setDisableStep(1)}>Back</Button>
                      <Button onClick={() => setDisableStep(3)} disabled={disableToken.length < 6}>Next</Button>
                    </div>
                  </div>
                )}

                {disableStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">For safety, please confirm your account password before disabling 2FA.</p>
                    <Input type="password" placeholder="Your account password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setDisableStep(2)}>Back</Button>
                      <Button onClick={() => setDisableStep(4)} disabled={!disablePassword}>Next</Button>
                    </div>
                  </div>
                )}

                {disableStep === 4 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Are you sure you want to disable two-factor authentication? This action will make your account less secure.</p>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setDisableStep(3)}>Back</Button>
                      <Button variant="destructive" onClick={async () => { setDisableStep(5); await performDisable2FA(disableToken, disablePassword); }}>Yes, disable 2FA</Button>
                    </div>
                  </div>
                )}

                {disableStep === 5 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Disabling two-factor authentication…</p>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => { setShowDisablePanel(false); setDisableStep(1); }}>Close</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
        <div className="space-y-2 mt-8">
          <h3 className="text-lg font-semibold text-destructive">Delete Account</h3>
          <p className="text-sm text-muted-foreground">Permanently delete your account and remove all associated data.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleAccountDeletion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Account</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
