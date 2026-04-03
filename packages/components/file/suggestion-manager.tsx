'use client'

import { useCallback, useEffect, useState } from 'react'

import {
    Check,
    ChevronDown,
    ChevronUp,
    Clock,
    FileEdit,
    MessageSquare,
    Trash2,
    X,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/packages/components/ui/dialog'
import { Label } from '@/packages/components/ui/label'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/packages/components/ui/tabs'

import { useToast } from '@/packages/hooks/use-toast'

interface Suggestion {
    id: string
    content: string
    message: string | null
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    createdAt: string
    user: {
        id: string
        name: string | null
        email: string | null
        image: string | null
        urlId: string
    }
}

interface SuggestionManagerProps {
    fileId: string
    isOwner: boolean
    isMarkdown?: boolean
}

export function SuggestionManager({
    fileId,
    isOwner,
    isMarkdown = false,
}: SuggestionManagerProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [pendingCount, setPendingCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('PENDING')
    const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null)
    const { toast } = useToast()

    const fetchSuggestions = useCallback(async (status: string) => {
        try {
            const res = await fetch(`/api/files/${fileId}/suggestions?status=${status}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setSuggestions(data.suggestions || [])
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to load suggestions',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }, [fileId, toast])

    const fetchPendingCount = useCallback(async () => {
        try {
            const res = await fetch(`/api/files/${fileId}/suggestions?status=PENDING`)
            if (!res.ok) return
            const data = await res.json()
            setPendingCount(data.suggestions?.length || 0)
        } catch {
            // Silent fail for count
        }
    }, [fileId])

    useEffect(() => {
        if (isOwner) {
            fetchPendingCount()
        }
    }, [isOwner, fetchPendingCount])

    useEffect(() => {
        if (isOwner) {
            setIsLoading(true)
            fetchSuggestions(activeTab)
        }
    }, [isOwner, activeTab, fetchSuggestions])

    const handleReview = async (suggestionId: string, action: 'approve' | 'reject') => {
        try {
            const res = await fetch(`/api/files/${fileId}/suggestions`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suggestionId, action }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to review suggestion')
            }

            setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))
            setPendingCount((prev) => Math.max(0, prev - 1))

            toast({
                title: 'Success',
                description: action === 'approve'
                    ? 'Suggestion approved and applied'
                    : 'Suggestion rejected',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to review',
                variant: 'destructive',
            })
        }
    }

    const handleDelete = async (suggestionId: string) => {
        try {
            const res = await fetch(
                `/api/files/${fileId}/suggestions?suggestionId=${suggestionId}`,
                { method: 'DELETE' }
            )

            if (!res.ok) throw new Error('Failed to delete')

            setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))
            if (activeTab === 'PENDING') {
                setPendingCount((prev) => Math.max(0, prev - 1))
            }

            toast({
                title: 'Success',
                description: 'Suggestion deleted',
            })
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to delete suggestion',
                variant: 'destructive',
            })
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (!isOwner) return null

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="glass-subtle glass-hover rounded-xl px-2.5 sm:px-3"
                >
                    <FileEdit className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Suggestions</span>
                    {pendingCount > 0 && (
                        <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                            {pendingCount}
                        </Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileEdit className="h-5 w-5" />
                        Edit Suggestions
                    </DialogTitle>
                    <DialogDescription>
                        Review and approve edit suggestions from collaborators.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="w-full justify-start">
                        <TabsTrigger value="PENDING" className="gap-1.5">
                            <Clock className="h-3 w-3" />
                            Pending
                            {pendingCount > 0 && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                    {pendingCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="APPROVED" className="gap-1.5">
                            <Check className="h-3 w-3" />
                            Approved
                        </TabsTrigger>
                        <TabsTrigger value="REJECTED" className="gap-1.5">
                            <X className="h-3 w-3" />
                            Rejected
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="flex-1 overflow-y-auto mt-4">
                        {isLoading ? (
                            <div className="text-sm text-muted-foreground text-center py-8">
                                Loading suggestions...
                            </div>
                        ) : suggestions.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border/50 rounded-lg">
                                No {activeTab.toLowerCase()} suggestions
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {suggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.id}
                                        className="glass-subtle overflow-hidden"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between p-3 bg-muted/30">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-7 w-7">
                                                    <AvatarImage
                                                        src={suggestion.user.image || undefined}
                                                        alt={suggestion.user.name || ''}
                                                    />
                                                    <AvatarFallback className="text-xs">
                                                        {suggestion.user.name?.charAt(0) || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {suggestion.user.name || suggestion.user.urlId}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(suggestion.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {activeTab === 'PENDING' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                                                            onClick={() => handleReview(suggestion.id, 'approve')}
                                                        >
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 px-2 text-destructive hover:text-destructive"
                                                            onClick={() => handleReview(suggestion.id, 'reject')}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() => handleDelete(suggestion.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() =>
                                                        setExpandedSuggestion(
                                                            expandedSuggestion === suggestion.id ? null : suggestion.id
                                                        )
                                                    }
                                                >
                                                    {expandedSuggestion === suggestion.id ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Message (if any) */}
                                        {suggestion.message && (
                                            <div className="px-3 py-2 border-b border-border/30 bg-muted/20">
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <MessageSquare className="h-3 w-3" />
                                                    {suggestion.message}
                                                </p>
                                            </div>
                                        )}

                                        {/* Content Preview */}
                                        {expandedSuggestion === suggestion.id && (
                                            <div className="p-3 max-h-[300px] overflow-auto">
                                                {isMarkdown ? (
                                                    <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            rehypePlugins={[rehypeHighlight]}
                                                        >
                                                            {suggestion.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted/30 p-3 rounded">
                                                        {suggestion.content}
                                                    </pre>
                                                )}
                                            </div>
                                        )}

                                        {/* Collapsed preview */}
                                        {expandedSuggestion !== suggestion.id && (
                                            <div className="px-3 py-2">
                                                <p className="text-xs text-muted-foreground font-mono truncate">
                                                    {suggestion.content.slice(0, 100)}
                                                    {suggestion.content.length > 100 && '...'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
