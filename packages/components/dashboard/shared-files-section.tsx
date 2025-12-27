'use client'

import { useEffect, useState } from 'react'

import { FileText, Loader2, Users } from 'lucide-react'
import Link from 'next/link'

import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/packages/components/ui/card'

interface SharedFile {
    id: string
    name: string
    urlPath: string
    mimeType: string
    size: number
    visibility: string
    createdAt: string
    updatedAt: string
    role: 'EDITOR' | 'SUGGESTER'
    owner: {
        id: string
        name: string | null
        urlId: string
        image: string | null
    }
    pendingSuggestions: number
}

interface SharedFilesResponse {
    data: SharedFile[]
    pagination: {
        total: number
        page: number
        limit: number
        pageCount: number
    }
}

export function SharedFilesSection() {
    const [files, setFiles] = useState<SharedFile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        async function fetchSharedFiles() {
            try {
                setIsLoading(true)
                const response = await fetch('/api/files/shared?limit=6')
                if (!response.ok) throw new Error('Failed to fetch shared files')
                const data: SharedFilesResponse = await response.json()
                setFiles(data.data)
                setTotal(data.pagination.total)
            } catch (error) {
                console.error('Error fetching shared files:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSharedFiles()
    }, [])

    if (isLoading) {
        return (
            <Card className="bg-white/5 dark:bg-black/5 backdrop-blur-sm border-white/10 dark:border-white/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Shared with Me
                    </CardTitle>
                    <CardDescription>Files others have shared with you</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (files.length === 0) {
        return null // Don't show section if no shared files
    }

    return (
        <Card className="bg-white/5 dark:bg-black/5 backdrop-blur-sm border-white/10 dark:border-white/5">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Shared with Me
                        </CardTitle>
                        <CardDescription>Files others have shared with you</CardDescription>
                    </div>
                    {total > 6 && (
                        <Link href="/dashboard?tab=shared">
                            <Button variant="outline" size="sm">
                                View All ({total})
                            </Button>
                        </Link>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {files.map((file) => (
                        <Link
                            key={file.id}
                            href={file.urlPath}
                            className="group flex items-start gap-3 rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:bg-accent/50"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium group-hover:text-primary">
                                    {file.name}
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                    <Avatar className="h-4 w-4">
                                        <AvatarImage src={file.owner.image || undefined} />
                                        <AvatarFallback className="text-[8px]">
                                            {file.owner.name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {file.owner.name || file.owner.urlId}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <Badge
                                        variant={file.role === 'EDITOR' ? 'default' : 'secondary'}
                                        className="text-[10px] px-1.5 py-0"
                                    >
                                        {file.role}
                                    </Badge>
                                    {file.pendingSuggestions > 0 && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/50">
                                            {file.pendingSuggestions} pending
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
