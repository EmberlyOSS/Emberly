"use client"

import { useState, useEffect } from "react"
import { Button } from "@/packages/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/packages/components/ui/card"
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

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/profile/2fa/recovery-codes")
      if (!res.ok) throw new Error("Failed to fetch status")
      const data = await res.json()
      setStatus(data)
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

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      const res = await fetch("/api/profile/2fa/recovery-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "" }), // Password optional for now
      })

      if (!res.ok) throw new Error("Failed to regenerate codes")
      
      const data: RecoveryCodesResponse = await res.json()
      setNewCodes(data.recoveryCodes)
      setShowCodes(true)
      
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
      <Card>
        <CardHeader>
          <CardTitle>Recovery Codes</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recovery Codes</CardTitle>
          <CardDescription>No recovery codes found</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Codes</CardTitle>
        <CardDescription>
          One-time use codes to access your account if you lose your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Codes</p>
            <p className="text-2xl font-semibold">{status.total}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-2xl font-semibold text-green-600">{status.remaining}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Used</p>
            <p className="text-2xl font-semibold text-orange-600">{status.used}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Generated</p>
            <p className="text-sm">
              {status.generatedAt
                ? new Date(status.generatedAt).toLocaleDateString()
                : "Never"}
            </p>
          </div>
        </div>

        {status.remaining <= 3 && status.remaining > 0 && (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 p-3 text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ You have only {status.remaining} codes remaining. Consider regenerating them soon.
          </div>
        )}

        {status.remaining === 0 && (
          <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-800 dark:text-red-200">
            ❌ All recovery codes have been used. You must regenerate them to continue having backup access.
          </div>
        )}

        {showCodes && newCodes.length > 0 && (
          <div className="space-y-2 rounded-md bg-slate-50 dark:bg-slate-900 p-4">
            <p className="text-sm font-semibold">New Recovery Codes:</p>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {newCodes.map((code, idx) => (
                <div key={idx} className="truncate">
                  {code}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ Save these codes immediately. You won't be able to see them again.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadCodes}
              className="w-full mt-2"
            >
              <Icons.download className="w-4 h-4 mr-2" />
              Download as Text File
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isRegenerating}
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

          {showCodes && newCodes.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setShowCodes(false)}
            >
              Hide Codes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
