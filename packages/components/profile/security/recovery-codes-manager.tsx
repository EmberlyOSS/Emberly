"use client"

import { useState, useEffect } from "react"
import { Button } from "@/packages/components/ui/button"
import { useToast } from "@/packages/hooks/use-toast"
import { Icons } from "@/packages/components/shared/icons"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/packages/components/ui/dialog"

interface RecoveryCodesStatus {
  total: number
  used: number
  remaining: number
  generatedAt: string | null
}

interface RecoveryCodesResponse {
  recoveryCodes: string[]
  success: boolean
  message: string
}

export function RecoveryCodesManager() {
  const { toast } = useToast()
  const [status, setStatus] = useState<RecoveryCodesStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showCodes, setShowCodes] = useState(false)
  const [newCodes, setNewCodes] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchStatus()
    // Try to load recently generated codes from session storage
    const stored = sessionStorage.getItem('recovery-codes-temp')
    if (stored) {
      try {
        const codes = JSON.parse(stored)
        if (Array.isArray(codes) && codes.length > 0) {
          setNewCodes(codes)
        }
      } catch (e) {
        // Invalid stored data, ignore
      }
    }
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/profile/2fa/recovery-codes")
      if (!res.ok) throw new Error("Failed to fetch status")
      const json = await res.json()
      // API responses are wrapped as { data, success }
      setStatus(json.data)
    } catch (error) {
      console.error("Error fetching recovery codes status:", error)
      toast({
        title: "Error",
        description: "Failed to load recovery codes status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAndShowCodes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/profile/2fa/recovery-codes?includeCodes=true")
      if (!res.ok) throw new Error("Failed to fetch codes")
      const json = await res.json()
      const codes = json.data?.recoveryCodes ?? []
      
      if (codes.length === 0) {
        toast({
          title: "No codes available",
          description: "You need to generate recovery codes first",
          variant: "destructive",
        })
        return
      }
      
      setNewCodes(codes)
      setShowCodes(true)
      sessionStorage.setItem('recovery-codes-temp', JSON.stringify(codes))
    } catch (error) {
      console.error("Error fetching codes:", error)
      toast({
        title: "Error",
        description: "Failed to load recovery codes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      const res = await fetch("/api/profile/2fa/recovery-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "" }), // Password optional for now
      })

      if (!res.ok) throw new Error("Failed to regenerate codes")
      const json = await res.json()
      const data: RecoveryCodesResponse = json.data
      const codes = data?.recoveryCodes ?? []
      setNewCodes(codes)
      setShowCodes(true)
      // Store in session storage temporarily
      sessionStorage.setItem('recovery-codes-temp', JSON.stringify(codes))
      
      // Refresh status
      await fetchStatus()
      
      toast({
        title: "Success",
        description: "Recovery codes regenerated. Save them in a safe place!",
      })
    } catch (error) {
      console.error("Error regenerating codes:", error)
      toast({
        title: "Error",
        description: "Failed to regenerate recovery codes",
        variant: "destructive",
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
    toast({
      title: "Copied",
      description: "Recovery code copied to clipboard",
    })
  }

  const copyAllCodes = () => {
    if (newCodes.length === 0) return
    const allCodes = newCodes.join('\n')
    navigator.clipboard.writeText(allCodes)
    toast({
      title: "Copied",
      description: "All recovery codes copied to clipboard",
    })
  }

  const downloadCodes = () => {
    if (newCodes.length === 0) return

    const content = `Emberly 2FA Recovery Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Save these codes in a safe place. Each code can be used once to access your account if you lose your authenticator app.

${newCodes.map((code, idx) => `${idx + 1}. ${code}`).join("\n")}

Do not share these codes with anyone.`

    const blob = new Blob([content], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `emberly-recovery-codes-${new Date().getTime()}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Downloaded",
      description: "Recovery codes saved to your device",
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Recovery Codes</h3>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Recovery Codes</h3>
          <p className="text-sm text-muted-foreground">No recovery codes found</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Recovery Codes</h3>
          <p className="text-sm text-muted-foreground">
            One-time use codes to access your account if you lose your authenticator app
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Codes</p>
            <p className="text-xl sm:text-2xl font-semibold">{status.total}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground">Remaining</p>
            <p className="text-xl sm:text-2xl font-semibold text-green-600">{status.remaining}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground">Used</p>
            <p className="text-xl sm:text-2xl font-semibold text-orange-600">{status.used}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground">Generated</p>
            <p className="text-xs sm:text-sm">
              {status.generatedAt
                ? new Date(status.generatedAt).toLocaleDateString()
                : "Never"}
            </p>
          </div>
        </div>

        {status.remaining <= 3 && status.remaining > 0 && (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 p-3 text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ You have only {status.remaining} codes remaining. Consider regenerating them soon.
          </div>
        )}

        {status.remaining === 0 && (
          <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-xs sm:text-sm text-red-800 dark:text-red-200">
            ❌ All recovery codes have been used. You must regenerate them to continue having backup access.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {status && status.remaining > 0 && (
            <Button
              variant="secondary"
              onClick={fetchAndShowCodes}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Icons.alertCircle className="w-4 h-4 mr-2" />
                  View Codes ({status.remaining} available)
                </>
              )}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isRegenerating}
                className="flex-1 sm:flex-none"
              >
                {isRegenerating ? (
                  <>
                    <Icons.spinner className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icons.refresh className="w-4 h-4 mr-2" />
                    Regenerate Codes
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Regenerate Recovery Codes?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will invalidate all existing recovery codes and create new ones. Make sure to save the new codes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRegenerate}>
                  Regenerate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Modal for displaying recovery codes */}
      <Dialog open={showCodes} onOpenChange={setShowCodes}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🔐 Your Recovery Codes
            </DialogTitle>
            <DialogDescription>
              Save these codes in a secure location. Each can be used once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md bg-background p-3 sm:p-4 space-y-2 border max-h-[50vh] overflow-y-auto">
              {newCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground w-6 flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <code className="font-mono text-sm sm:text-base font-semibold tracking-wider break-all">
                      {code}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyCode(code, idx)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    {copiedIndex === idx ? (
                      <Icons.check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Icons.copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/50 p-3 text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 flex gap-2">
              <span className="text-base flex-shrink-0">⚠️</span>
              <div>
                <p className="font-semibold">Important:</p>
                <p className="text-xs mt-1">
                  DO NOT share these codes with anyone. They provide direct access to your account if you lose your primary 2FA method.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="default"
                onClick={downloadCodes}
                className="w-full sm:flex-1"
              >
                <Icons.download className="w-4 h-4 mr-2" />
                Download as File
              </Button>
              <Button
                variant="outline"
                onClick={copyAllCodes}
                className="w-full sm:flex-1"
              >
                <Icons.copy className="w-4 h-4 mr-2" />
                Copy All Codes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
