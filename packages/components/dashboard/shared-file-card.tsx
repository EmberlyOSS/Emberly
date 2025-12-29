'use client'

import Image from 'next/image'
import Link from 'next/link'

import { formatDistanceToNow } from 'date-fns'
import { Eye, FileCode, Link as LinkIcon, User } from 'lucide-react'

import { getFileIcon } from '@/packages/components/dashboard/file-card/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Card } from '@/packages/components/ui/card'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/packages/components/ui/tooltip'

import { formatFileSize } from '@/packages/lib/utils'
import { writeToClipboard } from '@/packages/lib/utils/clipboard'
import { sanitizeUrl } from '@/packages/lib/utils/url'

import { useToast } from '@/packages/hooks/use-toast'

interface SharedFile {
    id: string
    name: string
    urlPath: string
    mimeType: string
    size: number
    visibility: string
    uploadedAt: string
    updatedAt: string
    isPaste: boolean
    role: string
    owner: {
        id: string
        name: string | null
        urlId: string | null
        image: string | null
    }
    pendingSuggestions: number
}

interface SharedFileCardProps {
    file: SharedFile
}

export function SharedFileCard({ file }: SharedFileCardProps) {
    const { toast } = useToast()

    const handleCopyLink = () => {
        const safeUrl = sanitizeUrl(file.urlPath)
        writeToClipboard(`${window.location.origin}${safeUrl}`)
            .then(() => {
                toast({
                    title: 'Link copied',
                    description: 'File link has been copied to clipboard',
                })
            })
            .catch(() => {
                toast({
                    title: 'Failed to copy link',
                    description: 'Please copy the link manually',
                    variant: 'destructive',
                })
            })
    }

    const isImage = file.mimeType.startsWith('image/')
    const Icon = file.isPaste ? FileCode : getFileIcon(file.mimeType)

    const roleLabel = file.role === 'EDITOR' ? 'Editor' : 'Suggester'
    const roleVariant = file.role === 'EDITOR' ? 'default' : 'secondary'

    return (
        <Card className="group relative overflow-hidden bg-white/5 dark:bg-white/[0.02] backdrop-blur-xl border-white/10 dark:border-white/5 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 hover:bg-white/[0.07] dark:hover:bg-white/[0.04] hover:border-white/15 dark:hover:border-white/10 transition-all duration-300">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

            {/* Preview Area */}
            <Link href={sanitizeUrl(file.urlPath)} className="block relative">
                <div className="relative aspect-video bg-white/5 dark:bg-white/[0.02] overflow-hidden">
                    {isImage ? (
                        <Image
                            src={`/api/files/${file.id}/thumbnail`}
                            alt={file.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Icon className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                    )}

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            </Link>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* File Name and Type */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <Link href={sanitizeUrl(file.urlPath)} className="block">
                            <h3 className="font-medium truncate hover:text-primary transition-colors">
                                {file.name}
                            </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">
                            {formatFileSize(file.size)}
                        </p>
                    </div>
                    <Badge variant={roleVariant} className="shrink-0 text-xs">
                        {roleLabel}
                    </Badge>
                </div>

                {/* Owner Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-5 w-5">
                        {file.owner.image ? (
                            <AvatarImage src={file.owner.image} alt={file.owner.name || 'Owner'} />
                        ) : null}
                        <AvatarFallback className="text-[10px]">
                            {file.owner.name?.charAt(0)?.toUpperCase() || <User className="h-3 w-3" />}
                        </AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                        {file.owner.name || 'Unknown'}
                    </span>
                </div>

                {/* Meta and Actions Row */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                        </span>
                        {file.pendingSuggestions > 0 && (
                            <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                                {file.pendingSuggestions} pending
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={handleCopyLink}
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy link</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        asChild
                                    >
                                        <Link href={sanitizeUrl(file.urlPath)}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View file</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </Card>
    )
}
