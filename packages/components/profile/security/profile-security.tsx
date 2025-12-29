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
import { LoginHistory } from "./login-history"
import { RecoveryCodesManager } from "./recovery-codes-manager"
import { Icons } from '@/packages/components/shared/icons'

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
  const [enableVerificationCode, setEnableVerificationCode] = useState("")
  const [disableVerificationCode, setDisableVerificationCode] = useState("")
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
      // Stage 1: Send verification code to email
      const sendRes = await fetch("/api/profile/2fa", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: setupSecret,
          token: setupToken,
          stage: 'send-code'
        }),
      })
      if (!sendRes.ok) {
        const data = await sendRes.json().catch(() => ({}))
        throw new Error(data.error || "Failed to send verification code")
      }

      // Move to verification code step
      setEnableStep(4)
      toast({ title: "Success", description: "Verification code sent to your email" })
    } catch (error) {
      console.error("Enable 2FA error", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to enable 2FA", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyEnable2FA = async () => {
    if (!setupSecret || !enableVerificationCode) return
    setIsLoading(true)
    try {
      // Stage 2: Verify code and enable 2FA
      const verifyRes = await fetch("/api/profile/2fa", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: setupSecret,
          verificationCode: enableVerificationCode,
          stage: 'verify-code'
        }),
      })
      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}))
        throw new Error(data.error || "Failed to verify code")
      }

      setTwoFactorEnabled(true)
      setShowEnablePanel(false)
      setSetupSecret(null)
      setSetupToken("")
      setEnableVerificationCode("")
      toast({ title: "Success", description: "Two-factor authentication enabled" })
      onUpdate()
    } catch (error) {
      console.error("Verify 2FA error", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to verify code", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const disable2FA = async () => {
    if (!disablePassword) return
    setIsLoading(true)
    try {
      // Stage 1: Send verification code to email
      const sendRes = await fetch("/api/profile/2fa", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: disablePassword,
          stage: 'send-code'
        }),
      })
      if (!sendRes.ok) {
        const data = await sendRes.json().catch(() => ({}))
        throw new Error(data.error || "Failed to send verification code")
      }

      // Move to TOTP + code step
      setDisableStep(3)
      toast({ title: "Success", description: "Verification code sent to your email" })
    } catch (error) {
      console.error("Disable 2FA send code error", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to send verification code", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const performDisable2FA = async (totpToken: string, verificationCode: string) => {
    if (!totpToken || !verificationCode) return
    setIsLoading(true)
    try {
      // Stage 2: Verify code + TOTP and disable 2FA
      const verifyRes = await fetch("/api/profile/2fa", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totpToken,
          verificationCode,
          stage: 'verify-code'
        }),
      })
      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}))
        throw new Error(data.error || "Failed to disable 2FA")
      }

      setTwoFactorEnabled(false)
      setDisableToken("")
      setDisablePassword("")
      setDisableVerificationCode("")
      setShowDisablePanel(false)
      toast({ title: "Success", description: "Two-factor authentication disabled" })
      onUpdate()
    } catch (error) {
      console.error("Disable 2FA verify error", error)
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
            <Input id="current-password" type="password" ref={currentPasswordRef} placeholder="Enter your current password" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" ref={newPasswordRef} placeholder="Enter your new password" minLength={8} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" ref={confirmPasswordRef} placeholder="Confirm your new password" minLength={8} required />
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
                          <div className="relative p-4 bg-white rounded-xl shadow-lg dark:shadow-primary/10 border border-border">
                            <QRCodeSVG
                              value={otpauth}
                              size={240}
                              bgColor="#ffffff"
                              fgColor="#000000"
                              level="M"
                              includeMargin={false}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                                <Icons.logo className="h-6 w-6 transition-transform group-hover:scale-110" />
                              </div>
                            </div>
                          </div>
                        ) : qrDataUrl ? (
                          // fallback to server-generated data URL if otpauth unavailable
                          <div className="p-4 bg-white rounded-xl shadow-lg dark:shadow-primary/10 border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrDataUrl} alt="2FA QR code" className="w-60 h-60 object-contain" />
                          </div>
                        ) : (
                          <div className="w-60 h-60 rounded-xl bg-muted/50 flex items-center justify-center border border-border">
                            <div className="text-sm text-muted-foreground animate-pulse">Loading QR…</div>
                          </div>
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
                      <Button onClick={confirmEnable2FA} disabled={isLoading || setupToken.length < 6}>{isLoading ? 'Sending code...' : 'Next'}</Button>
                    </div>
                  </div>
                )}

                {enableStep === 4 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Enter the verification code sent to your email to confirm enabling 2FA.</p>
                    <Input placeholder="000000" value={enableVerificationCode} onChange={(e) => setEnableVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setEnableStep(3)}>Back</Button>
                      <Button onClick={verifyEnable2FA} disabled={isLoading || enableVerificationCode.length < 6}>{isLoading ? 'Verifying...' : 'Enable 2FA'}</Button>
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
                    <p className="text-sm text-muted-foreground">For safety, please confirm your account password to begin the disable process.</p>
                    <Input type="password" placeholder="Your account password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setDisableStep(1)}>Back</Button>
                      <Button onClick={disable2FA} disabled={!disablePassword || isLoading}>{isLoading ? 'Sending code...' : 'Next'}</Button>
                    </div>
                  </div>
                )}

                {disableStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app and the verification code sent to your email.</p>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Authenticator Code</label>
                      <Input placeholder="123456" value={disableToken} onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Verification Code</label>
                      <Input placeholder="000000" value={disableVerificationCode} onChange={(e) => setDisableVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setDisableStep(2)}>Back</Button>
                      <Button variant="destructive" onClick={() => performDisable2FA(disableToken, disableVerificationCode)} disabled={disableToken.length < 6 || disableVerificationCode.length < 6 || isLoading}>{isLoading ? 'Disabling...' : 'Disable 2FA'}</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Recovery Codes */}
        {twoFactorEnabled && (
          <div className="border-t pt-6 mt-6">
            <RecoveryCodesManager />
          </div>
        )}

        {/* Login History & Sessions */}
        <div className="border-t pt-6 mt-6">
          <LoginHistory />
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
