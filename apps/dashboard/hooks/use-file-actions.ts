import { useRouter } from 'next/navigation'

import { writeToClipboard } from '@/lib/utils/clipboard'

import { useToast } from './use-toast'

export interface FileActionsOptions {
  urlPath?: string
  name?: string
  fileId?: string
  verifiedPassword?: string
}

export function useFileActions(options: FileActionsOptions = {}) {
  const router = useRouter()
  const { toast } = useToast()

  const copyUrl = () => {
    if (!options.urlPath) return

    const baseUrl = window.location.origin
    const url = `${baseUrl}${options.urlPath}`
    writeToClipboard(url)
      .then(() => {
        toast({
          title: 'URL copied',
          description: 'The file URL has been copied to your clipboard',
        })
      })
      .catch(() => {
        toast({
          title: 'Failed to copy URL',
          description: 'Please copy the URL manually',
          variant: 'destructive',
        })
      })
  }

  const copyRawUrl = () => {
    if (!options.urlPath) return

    const baseUrl = window.location.origin
    let url = `${baseUrl}${options.urlPath}/raw`

    if (options.verifiedPassword) {
      url += `?password=${encodeURIComponent(options.verifiedPassword)}`
    }

    writeToClipboard(url)
      .then(() => {
        toast({
          title: 'Raw URL copied',
          description: 'The raw file URL has been copied to your clipboard',
        })
      })
      .catch(() => {
        toast({
          title: 'Failed to copy URL',
          description: 'Please copy the URL manually',
          variant: 'destructive',
        })
      })
  }

  const download = () => {
    if (!options.name) return

    const baseUrl = window.location.origin
    let url: string

    if (options.fileId) {
      url = `${baseUrl}/api/files/${options.fileId}/download`

      if (options.verifiedPassword) {
        url += `?password=${encodeURIComponent(options.verifiedPassword)}`
      }
    } else if (options.urlPath) {
      url = `${baseUrl}${options.urlPath}/raw`

      if (options.verifiedPassword) {
        url += `?password=${encodeURIComponent(options.verifiedPassword)}`
      }
    } else {
      return
    }

    const link = document.createElement('a')
    link.href = url
    link.download = options.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openRaw = () => {
    if (!options.urlPath) return

    const baseUrl = window.location.origin
    let url = `${baseUrl}${options.urlPath}/raw`

    if (options.verifiedPassword) {
      url += `?password=${encodeURIComponent(options.verifiedPassword)}`
    }

    window.open(url, '_blank')
  }

  return {
    copyUrl,
    copyRawUrl,
    download,
    openRaw,
  }
}
