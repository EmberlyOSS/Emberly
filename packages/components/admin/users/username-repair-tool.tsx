'use client'

import { useCallback, useState } from 'react'
import { AlertCircle, Check, Loader2, Zap } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/packages/components/ui/alert-dialog'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/packages/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'
import { toast } from '@/packages/hooks/use-toast'

type RepairAction = 'replace-hyphen' | 'replace-underscore' | 'remove-spaces'

interface RepairResult {
  userId: string
  email: string
  oldName: string
  newName: string
  status: 'success' | 'skipped' | 'error'
  reason?: string
}

interface RepairResponse {
  message: string
  mode: 'dry-run' | 'applied' | 'scan'
  action: RepairAction
  summary: {
    total: number
    success: number
    skipped: number
    error: number
  }
  results: RepairResult[]
}

export function UsernameRepairTool() {
  const [action, setAction] = useState<RepairAction>('replace-hyphen')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<RepairResponse | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const actionDescriptions: Record<RepairAction, string> = {
    'replace-hyphen': 'Replace spaces with hyphens (e.g., "John Doe" → "John-Doe")',
    'replace-underscore': 'Replace spaces with underscores (e.g., "John Doe" → "John_Doe")',
    'remove-spaces': 'Remove spaces entirely (e.g., "John Doe" → "JohnDoe")',
  }

  const runRepair = useCallback(
    async (dryRun: boolean) => {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/users/repair-usernames', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            dryRun,
            confirm: !dryRun,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          toast({
            title: 'Error',
            description: error.error || 'Failed to run repair',
            variant: 'destructive',
          })
          return
        }

        const data: RepairResponse = await response.json()
        setResults(data)

        if (dryRun) {
          toast({
            title: 'Dry-run complete',
            description: `Found ${data.summary.success} repairs, ${data.summary.skipped} skipped`,
          })
        } else {
          toast({
            title: 'Repair applied',
            description: `Repaired ${data.summary.success} username(s)`,
          })
          setShowConfirmDialog(false)
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [action]
  )

  return (
    <div className="space-y-6">
      <Card className="border-amber-500/20 bg-amber-50/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle>Username Repair Tool</CardTitle>
              <CardDescription>
                Detect and fix usernames containing spaces
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strategy Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Repair Strategy</label>
            <Select value={action} onValueChange={(v) => setAction(v as RepairAction)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="replace-hyphen">Replace with Hyphens</SelectItem>
                <SelectItem value="replace-underscore">Replace with Underscores</SelectItem>
                <SelectItem value="remove-spaces">Remove Spaces</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{actionDescriptions[action]}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => runRepair(true)}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test (Dry-run)
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={loading || !results || results.mode === 'applied'}
              className="flex-1"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Apply Changes
            </Button>
          </div>

          {/* Results */}
          {results && (
            <Tabs defaultValue="summary" className="pt-4 border-t">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">{results.summary.total}</p>
                  </div>
                  <div className="rounded-lg bg-green-500/10 p-3">
                    <p className="text-xs text-muted-foreground">Success</p>
                    <p className="text-xl font-bold text-green-600">{results.summary.success}</p>
                  </div>
                  <div className="rounded-lg bg-yellow-500/10 p-3">
                    <p className="text-xs text-muted-foreground">Skipped</p>
                    <p className="text-xl font-bold text-yellow-600">{results.summary.skipped}</p>
                  </div>
                  <div className="rounded-lg bg-red-500/10 p-3">
                    <p className="text-xs text-muted-foreground">Error</p>
                    <p className="text-xl font-bold text-red-600">{results.summary.error}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">{results.message}</p>
              </TabsContent>

              <TabsContent value="details" className="space-y-3 pt-4">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {results.results.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No results</p>
                  ) : (
                    results.results.map((result, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border p-3 text-sm space-y-1 bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs text-muted-foreground truncate">
                              {result.email}
                            </p>
                            <p className="mt-1">
                              <span className="text-foreground">{result.oldName}</span>
                              <span className="mx-2 text-muted-foreground">→</span>
                              <span className="font-medium">{result.newName}</span>
                            </p>
                          </div>
                          <Badge
                            variant={
                              result.status === 'success'
                                ? 'default'
                                : result.status === 'skipped'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className="shrink-0"
                          >
                            {result.status === 'success' && (
                              <Check className="h-3 w-3 mr-1" />
                            )}
                            {result.status === 'skipped' && (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {result.status}
                          </Badge>
                        </div>
                        {result.reason && (
                          <p className="text-xs text-muted-foreground">{result.reason}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Username Repairs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will repair {results?.summary.success || 0} username(s) across{' '}
              {results?.summary.total || 0} users. This action cannot be undone easily.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => runRepair(false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
