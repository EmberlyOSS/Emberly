'use client'

import { useCallback, useMemo, useState } from 'react'

import type { File } from '@/prisma/generated/prisma/client'
import CodeMirror from '@uiw/react-codemirror'
import {
    ArrowLeft,
    Eye,
    FileCode,
    MessageSquare,
    Send,
    Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Label } from '@/packages/components/ui/label'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/packages/components/ui/tabs'
import { Textarea } from '@/packages/components/ui/textarea'
import { getLanguageExtension } from '@/packages/components/file/protected/language-utils'

import { useToast } from '@/packages/hooks/use-toast'

// Language detection based on mime type
const LANGUAGE_MAP: Record<string, string> = {
    'text/plain': 'text',
    'text/markdown': 'markdown',
    'text/x-markdown': 'markdown',
    'text/javascript': 'javascript',
    'text/typescript': 'typescript',
    'text/jsx': 'jsx',
    'text/tsx': 'tsx',
    'text/x-python': 'python',
    'text/html': 'html',
    'text/css': 'css',
    'application/json': 'json',
    'text/yaml': 'yaml',
    'text/x-yaml': 'yaml',
    'text/x-sql': 'sql',
    'text/x-java': 'java',
    'text/x-c++src': 'cpp',
    'text/x-csrc': 'c',
    'text/x-rustsrc': 'rust',
    'text/x-go': 'go',
    'text/x-php': 'php',
    'text/xml': 'xml',
    'application/xml': 'xml',
    'text/x-sass': 'sass',
    'text/x-scss': 'scss',
    'text/x-less': 'less',
}

interface SuggestEditFormProps {
    file: File & { urlPath: string }
    initialContent: string
}

export function SuggestEditForm({ file, initialContent }: SuggestEditFormProps) {
    const [content, setContent] = useState(initialContent)
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
    const router = useRouter()
    const { toast } = useToast()

    const language = useMemo(() => {
        if (LANGUAGE_MAP[file.mimeType]) {
            return LANGUAGE_MAP[file.mimeType]
        }
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (ext === 'md' || ext === 'markdown') return 'markdown'
        if (ext === 'js') return 'javascript'
        if (ext === 'ts') return 'typescript'
        if (ext === 'jsx') return 'jsx'
        if (ext === 'tsx') return 'tsx'
        if (ext === 'py') return 'python'
        if (ext === 'html') return 'html'
        if (ext === 'css') return 'css'
        if (ext === 'json') return 'json'
        if (ext === 'yaml' || ext === 'yml') return 'yaml'
        if (ext === 'sql') return 'sql'
        return 'text'
    }, [file.mimeType, file.name])

    const isMarkdown = language === 'markdown'
    const hasChanges = content !== initialContent

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!hasChanges) {
            toast({
                title: 'No changes',
                description: 'Make some changes before submitting',
            })
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch(`/api/files/${file.id}/suggestions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, message: message || undefined }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to submit suggestion')
            }

            toast({
                title: 'Success',
                description: 'Your suggestion has been submitted for review',
            })

            // Navigate back to the file view
            router.push(`/${file.urlPath}`)
        } catch (error) {
            toast({
                title: 'Error',
                description:
                    error instanceof Error
                        ? error.message
                        : 'An unexpected error occurred',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const editorExtensions = useMemo(() => {
        if (language === 'text') return []
        return [getLanguageExtension(language)]
    }, [language])

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Info */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-3">
                    <FileCode className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {language.charAt(0).toUpperCase() + language.slice(1)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            Modified
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                        {content.split('\n').length} lines
                    </Badge>
                </div>
            </div>

            {/* Message Field */}
            <div className="space-y-2">
                <Label htmlFor="message" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Message (optional)
                </Label>
                <Textarea
                    id="message"
                    placeholder="Describe your changes..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-background/50 border-border/50 resize-none"
                    rows={2}
                />
            </div>

            {/* Editor Section */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                        Suggested Content
                        {isMarkdown && (
                            <Badge variant="secondary" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Preview Available
                            </Badge>
                        )}
                    </Label>
                </div>

                {isMarkdown ? (
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}
                        className="w-full"
                    >
                        <TabsList className="w-full justify-start bg-background/50 border border-border/50">
                            <TabsTrigger value="edit" className="flex items-center gap-2">
                                <FileCode className="h-4 w-4" />
                                Edit
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Preview
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit" className="mt-2">
                            <div className="rounded-lg border border-border/50 overflow-hidden">
                                <CodeMirror
                                    value={content}
                                    onChange={setContent}
                                    extensions={editorExtensions}
                                    theme="dark"
                                    height="400px"
                                    placeholder="Enter your suggested content..."
                                    basicSetup={{
                                        lineNumbers: true,
                                        highlightActiveLine: true,
                                        foldGutter: true,
                                        bracketMatching: true,
                                        closeBrackets: true,
                                        autocompletion: true,
                                    }}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="preview" className="mt-2">
                            <div className="rounded-lg border border-border/50 bg-background/50 p-6 min-h-[400px] max-h-[400px] overflow-auto prose prose-neutral dark:prose-invert max-w-none">
                                {content ? (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeHighlight]}
                                    >
                                        {content}
                                    </ReactMarkdown>
                                ) : (
                                    <p className="text-muted-foreground text-center py-16">
                                        Start typing to see the preview...
                                    </p>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                        <CodeMirror
                            value={content}
                            onChange={setContent}
                            extensions={editorExtensions}
                            theme="dark"
                            height="400px"
                            placeholder="Enter your suggested content..."
                            basicSetup={{
                                lineNumbers: true,
                                highlightActiveLine: true,
                                foldGutter: true,
                                bracketMatching: true,
                                closeBrackets: true,
                                autocompletion: true,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="bg-background/50 border-border/50"
                >
                    <Link href={`/${file.urlPath}`}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Cancel
                    </Link>
                </Button>
                <Button
                    type="submit"
                    className="flex-1"
                    size="lg"
                    disabled={isSubmitting || !hasChanges}
                >
                    {isSubmitting ? (
                        <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Suggestion
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
