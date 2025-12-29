'use client'

import { useCallback, useMemo, useState } from 'react'

import type { File } from '@/prisma/generated/prisma/client'
import CodeMirror from '@uiw/react-codemirror'
import {
    ArrowLeft,
    Copy,
    Eye,
    FileCode,
    Save,
    Sparkles,
    Users,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Label } from '@/packages/components/ui/label'
import { Switch } from '@/packages/components/ui/switch'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/packages/components/ui/tabs'
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

interface EditPasteFormProps {
    file: File
    initialContent: string
}

export function EditPasteForm({ file, initialContent }: EditPasteFormProps) {
    const [content, setContent] = useState(initialContent)
    const [allowSuggestions, setAllowSuggestions] = useState(file.allowSuggestions)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
    const router = useRouter()
    const { toast } = useToast()

    const language = useMemo(() => {
        // Try to detect from mime type
        if (LANGUAGE_MAP[file.mimeType]) {
            return LANGUAGE_MAP[file.mimeType]
        }
        // Try to detect from filename extension
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
        if (ext === 'java') return 'java'
        if (ext === 'cpp' || ext === 'cc' || ext === 'cxx') return 'cpp'
        if (ext === 'c') return 'c'
        if (ext === 'rs') return 'rust'
        if (ext === 'go') return 'go'
        if (ext === 'php') return 'php'
        if (ext === 'xml') return 'xml'
        if (ext === 'sass') return 'sass'
        if (ext === 'scss') return 'scss'
        if (ext === 'less') return 'less'
        return 'text'
    }, [file.mimeType, file.name])

    const isMarkdown = language === 'markdown'

    const hasChanges = content !== initialContent || allowSuggestions !== file.allowSuggestions

    const handleCopyToClipboard = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(content)
            toast({
                title: 'Copied!',
                description: 'Content copied to clipboard',
            })
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to copy to clipboard',
                variant: 'destructive',
            })
        }
    }, [content, toast])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) {
            toast({
                title: 'Error',
                description: 'Content cannot be empty',
                variant: 'destructive',
            })
            return
        }

        if (!hasChanges) {
            toast({
                title: 'No changes',
                description: 'No changes were made to the content',
            })
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch(`/api/files/${file.id}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, allowSuggestions }),
            })

            if (!response.ok) {
                let errorDescription = 'Failed to update paste'
                try {
                    const errorData = await response.json()
                    if (errorData?.error) {
                        errorDescription = errorData.error
                    }
                } catch {
                    // Ignore JSON parse errors
                }
                throw new Error(errorDescription)
            }

            toast({
                title: 'Success',
                description: 'Paste updated successfully',
            })

            // Navigate back to the file view
            router.push(file.urlPath)
            router.refresh()
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
                            {language.charAt(0).toUpperCase() + language.slice(1)} • {file.mimeType}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                            Unsaved changes
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                        {content.split('\n').length} lines
                    </Badge>
                </div>
            </div>

            {/* Editor Section */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                        Content
                        {isMarkdown && (
                            <Badge variant="secondary" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Preview Available
                            </Badge>
                        )}
                    </Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyToClipboard}
                        disabled={!content}
                        className="h-8 px-2"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
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
                                    height="500px"
                                    placeholder="Enter your markdown content here..."
                                    basicSetup={{
                                        lineNumbers: true,
                                        highlightActiveLine: true,
                                        highlightActiveLineGutter: true,
                                        foldGutter: true,
                                        dropCursor: true,
                                        allowMultipleSelections: true,
                                        indentOnInput: true,
                                        bracketMatching: true,
                                        closeBrackets: true,
                                        autocompletion: true,
                                        rectangularSelection: true,
                                        crosshairCursor: true,
                                        highlightSelectionMatches: true,
                                    }}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="preview" className="mt-2">
                            <div className="rounded-lg border border-border/50 bg-background/50 p-6 min-h-[500px] max-h-[500px] overflow-auto prose prose-neutral dark:prose-invert max-w-none">
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
                            height="500px"
                            placeholder="Enter your code or text here..."
                            basicSetup={{
                                lineNumbers: true,
                                highlightActiveLine: true,
                                highlightActiveLineGutter: true,
                                foldGutter: true,
                                dropCursor: true,
                                allowMultipleSelections: true,
                                indentOnInput: true,
                                bracketMatching: true,
                                closeBrackets: true,
                                autocompletion: true,
                                rectangularSelection: true,
                                crosshairCursor: true,
                                highlightSelectionMatches: true,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Collaboration Settings */}
            <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Collaboration Settings
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="allowSuggestions" className="text-sm font-medium">
                            Allow Edit Suggestions
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Other users can suggest edits to this paste that you can review and approve
                        </p>
                    </div>
                    <Switch
                        id="allowSuggestions"
                        checked={allowSuggestions}
                        onCheckedChange={setAllowSuggestions}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="bg-background/50 border-border/50"
                >
                    <Link href={file.urlPath}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Cancel
                    </Link>
                </Button>
                <Button
                    type="submit"
                    className="flex-1"
                    size="lg"
                    disabled={isSubmitting || !content.trim() || !hasChanges}
                >
                    {isSubmitting ? (
                        <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Saving changes...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
