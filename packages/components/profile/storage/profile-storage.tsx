'use client'

import { ProfileStorageProps } from '@/packages/types/components/profile'

import { Icons } from '@/packages/components/shared/icons'
import { Progress } from '@/packages/components/ui/progress'

import { cn } from '@/packages/lib/utils'

export function ProfileStorage({
  quotasEnabled,
  formattedQuota,
  formattedUsed,
  usagePercentage,
  fileCount,
  shortUrlCount,
}: ProfileStorageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Storage Usage</h3>
        <p className="text-sm text-muted-foreground">
          {quotasEnabled
            ? 'Monitor your storage usage and available space.'
            : 'Track how much storage space you are using.'}
        </p>
      </div>

      <div className="space-y-4">
        {quotasEnabled ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xl font-bold">{formattedUsed}</span>
                  <span className="text-sm text-muted-foreground">
                    Used Space
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xl font-bold">{formattedQuota}</span>
                  <span className="text-sm text-muted-foreground">
                    Total Space
                  </span>
                </div>
              </div>

              <div>
                <Progress
                  value={usagePercentage}
                  className={cn(
                    'h-3 bg-white/10 dark:bg-black/10',
                    usagePercentage > 90
                      ? '[&>div]:bg-destructive'
                      : usagePercentage > 75
                        ? '[&>div]:bg-yellow-500'
                        : '[&>div]:bg-primary'
                  )}
                />
                <div className="flex items-center justify-between mt-2">
                  {usagePercentage > 75 && (
                    <div
                      className={cn(
                        'flex items-center gap-2 text-sm',
                        usagePercentage > 90
                          ? 'text-destructive'
                          : 'text-yellow-500'
                      )}
                    >
                      <Icons.alertCircle className="h-4 w-4" />
                      <span>
                        {usagePercentage > 90
                          ? 'Storage space is critically low'
                          : 'Storage space is getting low'}
                      </span>
                    </div>
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium ml-auto',
                      usagePercentage > 90
                        ? 'text-destructive'
                        : usagePercentage > 75
                          ? 'text-yellow-500'
                          : 'text-muted-foreground'
                    )}
                  >
                    {usagePercentage.toFixed(1)}% used
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between rounded-xl p-4 bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5">
            <div className="flex flex-col">
              <span className="text-xl font-bold">{formattedUsed}</span>
              <span className="text-sm text-muted-foreground">
                Total Space Used
              </span>
            </div>
            <div className="flex items-center text-primary/80">
              <Icons.infinity className="h-5 w-5" />
              <span className="ml-2 text-sm font-medium">Uncapped Storage</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-xl p-4 bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5">
            <div className="flex flex-col">
              <span className="text-xl font-bold">{fileCount}</span>
              <span className="text-sm text-muted-foreground">Total Files</span>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <Icons.file className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl p-4 bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5">
            <div className="flex flex-col">
              <span className="text-xl font-bold">{shortUrlCount}</span>
              <span className="text-sm text-muted-foreground">
                Shortened URLs
              </span>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Icons.copy className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
