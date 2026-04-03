'use client'

import React from 'react'

import Image from 'next/image'

import { FileType } from '@/packages/types/components/file'
import {
    ExternalLink,
    Globe,
    Image as ImageIcon,
    MessageSquare,
    X,
} from 'lucide-react'

import { Button } from '@/packages/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/packages/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'

import { formatFileSize, getRelativeTime } from '@/packages/lib/utils'
import { sanitizeUrl } from '@/packages/lib/utils/url'

interface EmbedPreviewDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    file: FileType
    enableRichEmbeds?: boolean
}

export function EmbedPreviewDialog({
    isOpen,
    onOpenChange,
    file,
    enableRichEmbeds = true,
}: EmbedPreviewDialogProps) {
    const isImage = file.mimeType.startsWith('image/')
    const isVideo = file.mimeType.startsWith('video/')
    const isAudio = file.mimeType.startsWith('audio/')

    const fileUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}${sanitizeUrl(file.urlPath)}`
            : sanitizeUrl(file.urlPath)

    const thumbnailUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/api/files/${file.id}/thumbnail`
            : `/api/files/${file.id}/thumbnail`

    const bannerUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/banner.png`
            : '/banner.png'

    const description = `📁 ${formatFileSize(file.size)} • Uploaded ${getRelativeTime(new Date(file.uploadedAt))}`

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ExternalLink className="h-5 w-5" />
                        Embed Preview
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="discord" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/30">
                        <TabsTrigger
                            value="discord"
                            className="flex items-center gap-2 data-[state=active]:bg-muted/50"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Discord
                        </TabsTrigger>
                        <TabsTrigger
                            value="twitter"
                            className="flex items-center gap-2 data-[state=active]:bg-muted/50"
                        >
                            <X className="h-4 w-4" />
                            Twitter/X
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="discord" className="mt-4">
                        <div className="space-y-3">
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                {enableRichEmbeds ? 'Rich Embed' : 'Plain Embed'}
                            </div>

                            {/* Discord Embed Preview */}
                            <div className="bg-[#2f3136] rounded-lg overflow-hidden border-l-4 border-primary">
                                <div className="p-4">
                                    {/* Site name */}
                                    <div className="text-xs text-[#00b0f4] font-medium mb-1">
                                        Emberly
                                    </div>

                                    {/* Title */}
                                    <div className="text-[#00b0f4] font-semibold hover:underline cursor-pointer text-sm mb-1">
                                        {file.name}
                                    </div>

                                    {/* Description */}
                                    {enableRichEmbeds && (
                                        <div className="text-[#dcddde] text-sm mb-3">
                                            {description}
                                        </div>
                                    )}

                                    {/* Image/Video preview */}
                                    {enableRichEmbeds && (isImage || isVideo) && (
                                        <div className="relative mt-2 rounded-md overflow-hidden bg-[#202225] max-w-[300px]">
                                            {isImage && (
                                                <Image
                                                    src={thumbnailUrl}
                                                    alt={file.name}
                                                    width={300}
                                                    height={200}
                                                    className="object-contain w-full h-auto max-h-[200px]"
                                                />
                                            )}
                                            {isVideo && (
                                                <div className="relative aspect-video flex items-center justify-center bg-[#202225]">
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                                                            <div className="w-0 h-0 border-l-[16px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1" />
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        Video preview
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Fallback image for non-media files */}
                                    {enableRichEmbeds && !isImage && !isVideo && !isAudio && (
                                        <div className="relative mt-2 rounded-md overflow-hidden bg-[#202225] max-w-[300px]">
                                            <Image
                                                src={bannerUrl}
                                                alt="Emberly"
                                                width={300}
                                                height={157}
                                                className="object-contain w-full h-auto"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!enableRichEmbeds && (
                                <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                                    <Globe className="h-4 w-4 inline mr-1.5" />
                                    Rich embeds are disabled. Only the URL will be shown when shared.
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="twitter" className="mt-4">
                        <div className="space-y-3">
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                {enableRichEmbeds
                                    ? isImage
                                        ? 'Summary Large Image'
                                        : 'Summary Card'
                                    : 'Plain URL'}
                            </div>

                            {/* Twitter Card Preview */}
                            <div className="bg-[#15202b] rounded-2xl overflow-hidden border border-[#38444d]">
                                {enableRichEmbeds && (isImage || !isVideo) && (
                                    <div className="relative aspect-[1.91/1] bg-[#192734]">
                                        {isImage ? (
                                            <Image
                                                src={thumbnailUrl}
                                                alt={file.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <ImageIcon className="h-12 w-12 text-[#8899a6]" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="p-3">
                                    <div className="text-[#8899a6] text-xs mb-0.5">
                                        {typeof window !== 'undefined'
                                            ? window.location.hostname
                                            : 'emberly.app'}
                                    </div>
                                    <div className="text-[#ffffff] font-normal text-sm line-clamp-1">
                                        {file.name}
                                    </div>
                                    {enableRichEmbeds && (
                                        <div className="text-[#8899a6] text-sm line-clamp-2 mt-0.5">
                                            {description}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!enableRichEmbeds && (
                                <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                                    <Globe className="h-4 w-4 inline mr-1.5" />
                                    Rich embeds are disabled. Only the URL will be shown when shared.
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground">
                        {enableRichEmbeds ? (
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                Rich embeds enabled
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                Plain embeds only
                            </span>
                        )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
