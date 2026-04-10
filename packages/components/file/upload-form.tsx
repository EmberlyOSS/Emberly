'use client'

import { useState } from 'react'

import Image from 'next/image'

import { ExpiryAction } from '@/packages/types/events'
import { $Enums } from '@/prisma/generated/prisma/client'
import { format } from 'date-fns'
import {
  CalendarIcon,
  FileIcon,
  PauseIcon,
  PlayIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'

import { ExpiryModal } from '@/packages/components/shared/expiry-modal'
import { Button } from '@/packages/components/ui/button'
import { Card } from '@/packages/components/ui/card'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import { Progress } from '@/packages/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'

import { formatBytes } from '@/packages/lib/utils'

import { FileWithPreview, useFileUpload } from '@/packages/hooks/use-file-upload'

interface UploadFormProps {
  maxSize: number
  formattedMaxSize: string
  user: {
    id: string
    defaultFileExpiration: $Enums.FileExpiration | null
    defaultFileExpirationAction: $Enums.ExpiryAction | null
  }
}

const getDefaultExpiryDate = (unit: $Enums.FileExpiration | null) => {
  if (!unit || unit === 'DISABLED') return undefined

  const date = new Date()

  switch (unit) {
    case 'HOUR':
      date.setHours(date.getHours() + 1)
      break
    case 'DAY':
      date.setDate(date.getDate() + 1)
      date.setHours(23, 59, 59, 999)
      break
    case 'WEEK':
      date.setDate(date.getDate() + 7)
      date.setHours(23, 59, 59, 999)
      break
    case 'MONTH':
      date.setMonth(date.getMonth() + 1)
      date.setHours(23, 59, 59, 999)
      break
  }

  return date
}

export function UploadForm({
  maxSize,
  formattedMaxSize,
  user,
}: UploadFormProps) {
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false)

  const {
    files,
    isUploading,
    isPaused,
    onDrop,
    removeFile,
    uploadFiles,
    togglePause,
    formatSpeed,
    visibility,
    setVisibility,
    password,
    setPassword,
    expiresAt,
    setExpiresAt,
  } = useFileUpload({
    maxSize,
    expiresAt: getDefaultExpiryDate(user.defaultFileExpiration),
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
  })

  return (
    <div className="space-y-8">
      <Card
        {...getRootProps()}
        className={`relative overflow-hidden p-8 border-2 border-dashed transition-all duration-300 ${isDragActive
          ? 'border-primary bg-primary/10 scale-[1.01] shadow-lg shadow-primary/20'
          : 'border-border/50 bg-background/80 hover:border-primary/50 hover:bg-background/90'
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <div className={`p-4 rounded-2xl mb-4 transition-colors ${isDragActive
            ? 'bg-primary/20 text-primary'
            : 'bg-background/80 text-muted-foreground'
            }`}>
            <UploadIcon className="w-10 h-10" />
          </div>
          <p className="text-lg font-medium">
            {isDragActive
              ? 'Drop the files here'
              : 'Drag and drop files here, or click to select files'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Maximum file size: {formattedMaxSize}
          </p>
        </div>
      </Card>

      {files.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Selected Files</h2>
          <div className="space-y-2">
            {files.map((file: FileWithPreview, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 glass-subtle transition-all hover:bg-muted/40"
              >
                {file.preview ? (
                  <Image
                    src={file.preview}
                    alt={file.name}
                    width={48}
                    height={48}
                    className="object-cover rounded"
                  />
                ) : (
                  <FileIcon className="w-12 h-12 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>
                        {file.uploaded !== undefined
                          ? `${formatBytes(file.uploaded)} / ${formatBytes(file.size)}`
                          : formatBytes(file.size)}
                      </span>
                      {file.uploadSpeed !== undefined &&
                        file.uploadSpeed > 0 &&
                        isUploading && (
                          <span className="text-xs">
                            {formatSpeed(file.uploadSpeed)}
                          </span>
                        )}
                    </div>
                    {file.progress !== undefined && file.progress > 0 && (
                      <div className="space-y-1">
                        <Progress
                          value={Math.min(file.progress, 100)}
                          className="h-1"
                        />
                        <p className="text-xs text-muted-foreground">
                          {file.progress}%
                          {isPaused &&
                            file.progress > 0 &&
                            file.progress < 100 && (
                              <span className="ml-2 text-orange-500">
                                (Paused)
                              </span>
                            )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {isUploading && file.progress > 0 && file.progress < 100 ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePause}
                    title={isPaused ? 'Resume upload' : 'Pause upload'}
                  >
                    {isPaused ? (
                      <PlayIcon className="w-4 h-4" />
                    ) : (
                      <PauseIcon className="w-4 h-4" />
                    )}
                  </Button>
                ) : !isUploading ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-6 space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Visibility</Label>
          <Select
            value={visibility}
            onValueChange={(value: 'PUBLIC' | 'PRIVATE') =>
              setVisibility(value)
            }
          >
            <SelectTrigger className="h-11 bg-background/80 border-border/50 focus:border-primary/50 focus:ring-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="PRIVATE">Private (only me)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Password Protection (Optional)</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave empty for no password"
            className="h-11 bg-background/80 border-border/50 focus:border-primary/50 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">File Expiration (Optional)</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal h-11 bg-background/80 border-border/50 hover:bg-background/90 hover:border-primary/30"
            onClick={() => setIsExpiryModalOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {expiresAt ? (
              <span>Expires: {format(expiresAt, 'PPP p')}</span>
            ) : (
              'Set expiration date'
            )}
          </Button>

          {expiresAt && (
            <div className="rounded-md bg-orange-50 dark:bg-orange-950/20 p-3 border border-orange-200 dark:border-orange-800/50">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Auto-delete scheduled
                </p>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                File will be permanently deleted on{' '}
                {format(expiresAt, 'PPPP p')}
              </p>
            </div>
          )}
        </div>

        <Button
          className="w-full shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all"
          size="lg"
          onClick={uploadFiles}
          disabled={files.length === 0 || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      </div>

      <ExpiryModal
        isOpen={isExpiryModalOpen}
        onOpenChange={setIsExpiryModalOpen}
        onConfirm={async (date, _action) => {
          setExpiresAt(date)
        }}
        initialDate={expiresAt}
        initialAction={
          (user.defaultFileExpirationAction as ExpiryAction) ??
          ExpiryAction.DELETE
        }
        title="Set File Expiration"
        description="Configure when uploaded files should be automatically deleted"
      />
    </div>
  )
}
