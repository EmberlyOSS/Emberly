'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

import { useDataExport } from '@/hooks/use-data-export'

export function ProfileExport() {
  const {
    isExporting,
    exportProgress,
    downloadProgress,
    status,
    handleExport,
  } = useDataExport()

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Export Your Data</h3>
        <p className="text-sm text-muted-foreground">Download a copy of all your uploaded files and account information.</p>

        <Alert variant="warning" className="mt-3">
          <AlertTitle className="font-extrabold text-md">Export temporarily unavailable</AlertTitle>
          <AlertDescription className="font-light text-xs">
            The full "Export All Data" archive is currently broken and will be re-enabled soon. You can still download your data in JSON format using the "Download JSON" tool below.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleExport}
          disabled={true}
          variant="outline"
          className="w-full sm:w-auto mt-2"
        >
          {isExporting ? (
            <div className="flex items-center gap-2">
              <span>
                {status === 'preparing'
                  ? `Preparing... ${exportProgress}%`
                  : status === 'downloading'
                    ? `Downloading... ${downloadProgress}%`
                    : 'Starting...'}
              </span>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-200"
                  style={{
                    width: `${status === 'preparing' ? exportProgress : downloadProgress}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            'Export All Data (temporarily disabled)'
          )}
        </Button>
      </div>
    </div>
  )
}
