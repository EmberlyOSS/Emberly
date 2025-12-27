'use client'

import { Download, AlertCircle } from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/packages/components/ui/alert'
import { Progress } from '@/packages/components/ui/progress'

import { useDataExport } from '@/packages/hooks/use-data-export'

export function ProfileExport() {
  const {
    isExporting,
    exportProgress,
    downloadProgress,
    status,
    handleExport,
  } = useDataExport()

  const currentProgress = status === 'preparing' ? exportProgress : downloadProgress
  const statusText = status === 'preparing'
    ? `Preparing export... ${exportProgress}%`
    : status === 'downloading'
      ? `Downloading... ${downloadProgress}%`
      : 'Starting export...'

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Export Your Data</h3>
        <p className="text-sm text-muted-foreground">
          Download a copy of all your uploaded files and account information as a ZIP archive.
        </p>
      </div>

      <Alert variant="default" className="border-primary/20 bg-primary/5">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>What's included</AlertTitle>
        <AlertDescription className="text-sm">
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>All your uploaded files (organized by date)</li>
            <li>Account information and settings</li>
            <li>URL shortener history</li>
            <li>File metadata and OCR data</li>
          </ul>
        </AlertDescription>
      </Alert>

      {isExporting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{statusText}</span>
            <span className="font-medium">{currentProgress}%</span>
          </div>
          <Progress value={currentProgress} className="h-2" />
        </div>
      )}

      <Button
        onClick={handleExport}
        disabled={isExporting}
        variant="outline"
        className="w-full sm:w-auto"
      >
        <Download className="h-4 w-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export All Data'}
      </Button>

      <p className="text-xs text-muted-foreground">
        Large exports may take several minutes. Files over 100MB are excluded to prevent timeouts.
      </p>
    </div>
  )
}
