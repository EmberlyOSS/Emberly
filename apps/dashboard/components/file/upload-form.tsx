'use client'

import { useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { $Enums } from '@emberly/db'
import { format } from 'date-fns'
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileIcon,
  Globe,
  Lock,
  PauseIcon,
  PlayIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'

import { Panel } from '@/components/layout/page-kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { cn, formatBytes } from '@/lib/utils'
import { writeToClipboard } from '@/lib/utils/clipboard'

import {
  FileWithPreview,
  UploadResponse,
  useFileUpload,
} from '@/hooks/use-file-upload'

interface UploadFormProps {
  maxSize: number
  formattedMaxSize: string
  user: {
    id: string
    defaultFileExpiration: $Enums.FileExpiration | null
    defaultFileExpirationAction: $Enums.ExpiryAction | null
  }
}

const VISIBILITY = [
  { value: 'PUBLIC', label: 'Public', icon: Globe },
  { value: 'PRIVATE', label: 'Private', icon: Lock },
] as const

type ExpiryPreset = 'never' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'custom'

const EXPIRY_OPTIONS: Array<{ value: ExpiryPreset; label: string }> = [
  { value: 'never', label: 'Never' },
  { value: 'HOUR', label: 'In 1 hour' },
  { value: 'DAY', label: 'In 1 day' },
  { value: 'WEEK', label: 'In 1 week' },
  { value: 'MONTH', label: 'In 1 month' },
  { value: 'custom', label: 'Pick a date…' },
]

function expiryFromPreset(preset: ExpiryPreset) {
  if (preset === 'never' || preset === 'custom') return null
  const date = new Date()
  switch (preset) {
    case 'HOUR':
      date.setHours(date.getHours() + 1)
      break
    case 'DAY':
      date.setDate(date.getDate() + 1)
      break
    case 'WEEK':
      date.setDate(date.getDate() + 7)
      break
    case 'MONTH':
      date.setMonth(date.getMonth() + 1)
      break
  }
  return date
}

function defaultPreset(unit: $Enums.FileExpiration | null): ExpiryPreset {
  return unit && unit !== 'DISABLED' ? unit : 'never'
}

const toLocalInput = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm")

export function UploadForm({
  maxSize,
  formattedMaxSize,
  user,
}: UploadFormProps) {
  const initialPreset = defaultPreset(user.defaultFileExpiration)
  const [preset, setPreset] = useState<ExpiryPreset>(initialPreset)
  const [showPassword, setShowPassword] = useState(false)
  const [uploaded, setUploaded] = useState<UploadResponse[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const {
    files,
    isUploading,
    isPaused,
    onDrop,
    removeFile,
    clearFiles,
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
    expiresAt: expiryFromPreset(initialPreset),
    onUploadComplete: (responses) =>
      setUploaded((prev) => [...responses, ...prev].slice(0, 20)),
  })

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxSize,
    noClick: files.length > 0,
  })

  const choosePreset = (value: ExpiryPreset) => {
    setPreset(value)
    if (value === 'custom') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setExpiresAt(expiresAt ?? tomorrow)
    } else {
      setExpiresAt(expiryFromPreset(value))
    }
  }

  const copy = async (url: string) => {
    try {
      await writeToClipboard(url)
      setCopied(url)
      setTimeout(() => setCopied((c) => (c === url ? null : c)), 1500)
    } catch {}
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
      <div className="min-w-0 space-y-6">
        <div
          {...getRootProps()}
          className={cn(
            'glass-card overflow-hidden border-2 border-dashed transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border/60 hover:border-primary/40',
            files.length === 0 && 'cursor-pointer'
          )}
        >
          <input {...getInputProps()} />

          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div
                className={cn(
                  'mb-4 rounded-2xl p-4 transition-colors',
                  isDragActive
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted/40 text-muted-foreground'
                )}
              >
                <UploadIcon className="h-8 w-8" />
              </div>
              <p className="font-medium">
                {isDragActive ? 'Drop to add files' : 'Drop files here'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or click to browse · up to {formattedMaxSize} each
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-muted/20 px-4 py-2.5">
                <p className="text-sm">
                  <span className="font-medium">
                    {files.length} {files.length === 1 ? 'file' : 'files'}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {formatBytes(totalSize)}
                  </span>
                </p>
                {!isUploading && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={open}>
                      Add more
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearFiles}>
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              <ul className="divide-y divide-border/40">
                {files.map((file: FileWithPreview, index) => {
                  const inProgress =
                    isUploading && file.progress > 0 && file.progress < 100
                  return (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      {file.preview ? (
                        <Image
                          src={file.preview}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted/40">
                          <FileIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate text-sm font-medium">
                            {file.name}
                          </p>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {file.progress > 0
                              ? `${formatBytes(file.uploaded)} / ${formatBytes(file.size)}`
                              : formatBytes(file.size)}
                          </span>
                        </div>
                        {file.progress > 0 && (
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Math.min(file.progress, 100)}
                              className="h-1 flex-1"
                            />
                            <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                              {isPaused && file.progress < 100
                                ? 'Paused'
                                : file.progress >= 100
                                  ? 'Processing…'
                                  : file.uploadSpeed
                                    ? formatSpeed(file.uploadSpeed)
                                    : `${file.progress}%`}
                            </span>
                          </div>
                        )}
                      </div>

                      {inProgress ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={togglePause}
                          aria-label={
                            isPaused ? 'Resume upload' : 'Pause upload'
                          }
                        >
                          {isPaused ? (
                            <PlayIcon className="h-4 w-4" />
                          ) : (
                            <PauseIcon className="h-4 w-4" />
                          )}
                        </Button>
                      ) : !isUploading ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => removeFile(index)}
                          aria-label={`Remove ${file.name}`}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </li>
                  )
                })}
              </ul>

              {isDragActive && (
                <p className="border-t border-border/50 py-3 text-center text-sm text-primary">
                  Drop to add files
                </p>
              )}
            </>
          )}
        </div>

        {uploaded.length > 0 && (
          <Panel
            title="Uploaded"
            description="Links stay here until you leave the page."
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/files">View all files</Link>
              </Button>
            }
            flush
          >
            <ul className="divide-y divide-border/40">
              {uploaded.map((item) => (
                <li
                  key={item.url}
                  className="flex items-center gap-3 px-5 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {item.url}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copy(item.url)}
                    aria-label="Copy link"
                  >
                    {copied === item.url ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    asChild
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      <aside className="glass-card space-y-5 p-5 lg:sticky lg:top-28">
        <div className="space-y-2">
          <Label>Visibility</Label>
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/60 bg-background/40 p-1">
            {VISIBILITY.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setVisibility(value)}
                aria-pressed={visibility === value}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm transition-colors',
                  visibility === value
                    ? 'bg-secondary font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {visibility === 'PUBLIC'
              ? 'Anyone with the link can view them.'
              : 'Only you can view them.'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="upload-password">
            Password{' '}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <div className="relative">
            <Input
              id="upload-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              data-1p-ignore
              data-lpignore="true"
              placeholder="No password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 border-border/50 bg-background/50 pr-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0.5 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="upload-expiry">Delete after</Label>
          <Select
            value={preset}
            onValueChange={(v) => choosePreset(v as ExpiryPreset)}
          >
            <SelectTrigger
              id="upload-expiry"
              className="h-9 border-border/50 bg-background/50"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPIRY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {preset === 'custom' && (
            <Input
              type="datetime-local"
              aria-label="Delete on"
              min={toLocalInput(new Date())}
              value={expiresAt ? toLocalInput(expiresAt) : ''}
              onChange={(e) =>
                setExpiresAt(e.target.value ? new Date(e.target.value) : null)
              }
              className="h-9 border-border/50 bg-background/50"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {expiresAt
              ? `Deleted for good on ${format(expiresAt, 'PPP p')}.`
              : 'Kept until you delete them.'}
          </p>
        </div>

        <Button
          className="w-full"
          onClick={uploadFiles}
          disabled={files.length === 0 || isUploading}
        >
          {isUploading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Uploading…
            </>
          ) : files.length > 1 ? (
            `Upload ${files.length} files`
          ) : (
            'Upload'
          )}
        </Button>
      </aside>
    </div>
  )
}
