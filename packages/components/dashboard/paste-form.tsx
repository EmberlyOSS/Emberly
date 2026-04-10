'use client'

import { useCallback, useMemo, useState } from 'react'

import CodeMirror from '@uiw/react-codemirror'
import {
  Copy,
  Eye,
  EyeOff,
  FileCode,
  Globe,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import { Badge } from '@/packages/components/ui/badge'
import { Button } from '@/packages/components/ui/button'
import { Input } from '@/packages/components/ui/input'
import { Label } from '@/packages/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/components/ui/select'
import { Switch } from '@/packages/components/ui/switch'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/packages/components/ui/tabs'
import { getLanguageExtension } from '@/packages/components/file/protected/language-utils'

import { useToast } from '@/packages/hooks/use-toast'

// Language options for the dropdown
const LANGUAGE_OPTIONS = [
  { value: 'text', label: 'Plain Text', extension: '.txt', mime: 'text/plain' },
  {
    value: 'markdown',
    label: 'Markdown',
    extension: '.md',
    mime: 'text/markdown',
  },
  {
    value: 'javascript',
    label: 'JavaScript',
    extension: '.js',
    mime: 'text/javascript',
  },
  {
    value: 'typescript',
    label: 'TypeScript',
    extension: '.ts',
    mime: 'text/typescript',
  },
  { value: 'jsx', label: 'JSX', extension: '.jsx', mime: 'text/jsx' },
  { value: 'tsx', label: 'TSX', extension: '.tsx', mime: 'text/tsx' },
  { value: 'python', label: 'Python', extension: '.py', mime: 'text/x-python' },
  { value: 'html', label: 'HTML', extension: '.html', mime: 'text/html' },
  { value: 'css', label: 'CSS', extension: '.css', mime: 'text/css' },
  { value: 'json', label: 'JSON', extension: '.json', mime: 'application/json' },
  { value: 'yaml', label: 'YAML', extension: '.yaml', mime: 'text/yaml' },
  { value: 'sql', label: 'SQL', extension: '.sql', mime: 'text/x-sql' },
  { value: 'java', label: 'Java', extension: '.java', mime: 'text/x-java' },
  { value: 'cpp', label: 'C++', extension: '.cpp', mime: 'text/x-c++src' },
  { value: 'c', label: 'C', extension: '.c', mime: 'text/x-csrc' },
  { value: 'rust', label: 'Rust', extension: '.rs', mime: 'text/x-rustsrc' },
  { value: 'go', label: 'Go', extension: '.go', mime: 'text/x-go' },
  { value: 'php', label: 'PHP', extension: '.php', mime: 'text/x-php' },
  { value: 'xml', label: 'XML', extension: '.xml', mime: 'text/xml' },
  { value: 'sass', label: 'Sass', extension: '.sass', mime: 'text/x-sass' },
  { value: 'scss', label: 'SCSS', extension: '.scss', mime: 'text/x-scss' },
  { value: 'less', label: 'Less', extension: '.less', mime: 'text/x-less' },
] as const

export function PasteForm() {
  const [content, setContent] = useState('')
  const [filename, setFilename] = useState('')
  const [language, setLanguage] = useState('text')
  const [visibility, setVisibility] = useState('PUBLIC')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [allowSuggestions, setAllowSuggestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const router = useRouter()
  const { toast } = useToast()

  const selectedLanguage = useMemo(
    () => LANGUAGE_OPTIONS.find((l) => l.value === language) || LANGUAGE_OPTIONS[0],
    [language]
  )

  const isMarkdown = language === 'markdown'

  const handleLanguageChange = useCallback((value: string) => {
    setLanguage(value)
    // Auto-update filename extension if filename exists
    setFilename((prev) => {
      if (!prev) return prev
      const langOption = LANGUAGE_OPTIONS.find((l) => l.value === value)
      if (!langOption) return prev
      const namePart = prev.replace(/\.[^/.]+$/, '')
      return namePart + langOption.extension
    })
  }, [])

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
        description: 'Please enter some content',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const finalFilename =
        filename || `paste${selectedLanguage.extension}`
      const file = new File([content], finalFilename, {
        type: selectedLanguage.mime,
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('visibility', visibility)
      if (password) formData.append('password', password)
      if (allowSuggestions) formData.append('allowSuggestions', 'true')

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorDescription = 'Failed to create paste'
        try {
          const errorData = await response.json()
          if (errorData?.message) {
            errorDescription = errorData.message
          }
        } catch (jsonError) {
          console.warn('Could not parse error response JSON:', jsonError)
        }
        throw new Error(errorDescription)
      }

      toast({
        title: 'Success',
        description: 'Paste created successfully',
      })

      try {
        const responseData = await response.json()
        if (responseData?.data?.url) {
          const urlPath = new URL(responseData.data.url).pathname
          router.push(urlPath)
        } else {
          console.warn(
            'Paste created, but no redirect URL found in response:',
            responseData
          )
          router.push('/dashboard')
        }
      } catch (jsonError) {
        console.error(
          'Paste created, but failed to parse response JSON for redirect URL:',
          jsonError
        )
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while creating the paste.',
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
      {/* Language, Filename and Editor */}
      <div className="glass-card p-6 space-y-6">
        {/* Language and Filename row */}
        <div className="grid gap-4 md:grid-cols-2 items-end">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            Language
          </Label>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="bg-background/50 border-border/50 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  <span className="flex items-center gap-2">
                    {lang.label}
                    <span className="text-xs text-muted-foreground">
                      {lang.extension}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filename">Filename (Optional)</Label>
          <Input
            id="filename"
            placeholder={`paste${selectedLanguage.extension}`}
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="bg-background/50 border-border/50 h-10"
          />
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
          <div className="flex items-center gap-2">
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
            {content && (
              <Badge variant="outline" className="text-xs">
                {content.split('\n').length} lines
              </Badge>
            )}
          </div>
        </div>

        {isMarkdown ? (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}
            className="w-full"
          >
            <TabsList className="w-full justify-start glass-subtle">
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
              <div className="glass-subtle overflow-hidden">
                <CodeMirror
                  value={content}
                  onChange={setContent}
                  extensions={editorExtensions}
                  theme="dark"
                  height="400px"
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
              <div className="glass-subtle p-6 min-h-[400px] max-h-[400px] overflow-auto prose prose-neutral dark:prose-invert max-w-none">
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
          <div className="glass-subtle overflow-hidden">
            <CodeMirror
              value={content}
              onChange={setContent}
              extensions={editorExtensions}
              theme="dark"
              height="400px"
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
      </div>

      {/* Visibility, Password and Collaboration */}
      <div className="glass-card p-6 space-y-6">
        {/* Visibility and Password row */}
        <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            {visibility === 'PUBLIC' ? (
              <Globe className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
            Visibility
          </Label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger className="bg-background/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Public
                </span>
              </SelectItem>
              <SelectItem value="PRIVATE">
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Private (only me)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Password Protection (Optional)
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Leave empty for no password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/50 border-border/50 pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Collaboration Settings */}
        <div className="border-t border-border/40 pt-6 space-y-4">
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
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting || !content.trim()}
      >
        {isSubmitting ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Creating paste...
          </>
        ) : (
          'Create Paste'
        )}
      </Button>
    </form>
  )
}
