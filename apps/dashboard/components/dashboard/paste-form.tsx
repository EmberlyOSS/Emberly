'use client'

import { useCallback, useMemo, useState } from 'react'

import CodeMirror, { EditorView } from '@uiw/react-codemirror'
import { Check, Copy, Eye, EyeOff, FileCode, Globe, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { getLanguageExtension } from '@/components/file/protected/language-utils'

import { cn } from '@/lib/utils'

import { useToast } from '@/hooks/use-toast'

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
  {
    value: 'json',
    label: 'JSON',
    extension: '.json',
    mime: 'application/json',
  },
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

const EDITOR_SETUP = {
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
}

// Blend the editor into the card instead of One Dark's own slate background
const editorSurface = EditorView.theme(
  {
    '&': { backgroundColor: 'transparent', fontSize: '13.5px' },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': {
      fontFamily:
        "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Menlo, Consolas, monospace",
      lineHeight: '1.65',
    },
    '.cm-content': { padding: '14px 0' },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'hsl(var(--muted-foreground) / 0.55)',
    },
    '.cm-activeLine': { backgroundColor: 'hsl(var(--foreground) / 0.04)' },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: 'hsl(var(--foreground) / 0.8)',
    },
    '.cm-placeholder': { color: 'hsl(var(--muted-foreground) / 0.7)' },
  },
  { dark: true }
)

const VISIBILITY = [
  { value: 'PUBLIC', label: 'Public', icon: Globe },
  { value: 'PRIVATE', label: 'Private', icon: Lock },
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
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const selectedLanguage = useMemo(
    () =>
      LANGUAGE_OPTIONS.find((l) => l.value === language) || LANGUAGE_OPTIONS[0],
    [language]
  )

  const isMarkdown = language === 'markdown'

  const handleLanguageChange = useCallback((value: string) => {
    setLanguage(value)
    setFilename((prev) => {
      if (!prev) return prev
      const langOption = LANGUAGE_OPTIONS.find((l) => l.value === value)
      if (!langOption) return prev
      return prev.replace(/\.[^/.]+$/, '') + langOption.extension
    })
  }, [])

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast({ title: "Couldn't copy", variant: 'destructive' })
    }
  }, [content, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      const finalFilename = filename || `paste${selectedLanguage.extension}`
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
      const body = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          body?.error || body?.message || "Couldn't create the paste"
        )
      }

      toast({ title: 'Paste created' })
      router.push(
        body?.data?.url ? new URL(body.data.url).pathname : '/dashboard/files'
      )
    } catch (error) {
      toast({
        title: "Couldn't create the paste",
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const editorExtensions = useMemo(() => {
    const base = [editorSurface, EditorView.lineWrapping]
    if (language === 'text') return base
    return [...base, getLanguageExtension(language)]
  }, [language])

  const lineCount = content ? content.split('\n').length : 0
  const showPreview = isMarkdown && activeTab === 'preview'

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start"
    >
      <div className="glass-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/50 bg-muted/20 px-3 py-2">
          <div className="flex min-w-[10rem] flex-1 items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 focus-within:border-primary/50">
            <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              id="filename"
              name="paste-filename"
              aria-label="Filename"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              placeholder={`paste${selectedLanguage.extension}`}
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="h-8 min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>

          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger
              className="h-8 w-[9.5rem] border-border/60 bg-background/60 text-sm"
              aria-label="Language"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isMarkdown && (
            <div className="flex rounded-md border border-border/60 bg-background/60 p-0.5 text-sm">
              {(['edit', 'preview'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={activeTab === tab}
                  className={cn(
                    'rounded px-2.5 py-1 capitalize transition-colors',
                    activeTab === tab
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-1">
            {lineCount > 0 && (
              <span className="px-1 text-xs tabular-nums text-muted-foreground">
                {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopyToClipboard}
              disabled={!content}
              className="h-8 w-8"
              aria-label="Copy content"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {showPreview ? (
          <div className="prose prose-neutral dark:prose-invert h-[30rem] max-w-none overflow-auto px-6 py-5">
            {content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight as any]}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <p className="py-16 text-center text-muted-foreground">
                Nothing to preview yet.
              </p>
            )}
          </div>
        ) : (
          <CodeMirror
            value={content}
            onChange={setContent}
            extensions={editorExtensions}
            theme="dark"
            height="30rem"
            placeholder={
              isMarkdown
                ? 'Write some markdown…'
                : 'Paste or type your code here…'
            }
            basicSetup={EDITOR_SETUP}
          />
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
              ? 'Anyone with the link can view it.'
              : 'Only you can view it.'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Password{' '}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              data-1p-ignore
              data-lpignore="true"
              placeholder="None, or at least 8 characters"
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

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <Label htmlFor="allowSuggestions">Allow suggestions</Label>
            <p className="text-xs text-muted-foreground">
              Others can propose edits for you to approve.
            </p>
          </div>
          <Switch
            id="allowSuggestions"
            checked={allowSuggestions}
            onCheckedChange={setAllowSuggestions}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating…
            </>
          ) : (
            'Create paste'
          )}
        </Button>
      </aside>
    </form>
  )
}
