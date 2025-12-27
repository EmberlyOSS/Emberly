import { useEffect, useMemo, useRef, useState } from 'react'

import CodeMirror from '@uiw/react-codemirror'
import { Code, Eye } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import { Badge } from '@/packages/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/packages/components/ui/tabs'

import { getLanguageExtension } from '../../protected/language-utils'
import { CODE_FILE_TYPES } from '../../protected/mime-types'
import { ErrorState } from '../components/error-state'
import { LoadingState } from '../components/loading-state'
import { useFileViewer } from '../context'

export function CodeViewer() {
  const { file, state, fetchContent } = useFileViewer()
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code')

  const language = useMemo(() => CODE_FILE_TYPES[file.mimeType] || 'text', [file.mimeType])
  const isMarkdown = useMemo(() =>
    file.mimeType === 'text/markdown' ||
    file.mimeType === 'text/x-markdown' ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.markdown'),
    [file.mimeType, file.name]
  )

  useEffect(() => {
    if (!state.content) {
      fetchContent()
    }
  }, [state.content, fetchContent])

  // Auto-switch to preview for markdown files
  useEffect(() => {
    if (isMarkdown && state.content) {
      setViewMode('preview')
    }
  }, [isMarkdown, state.content])

  if (state.isLoading) {
    return <LoadingState message="Loading code content..." />
  }

  if (state.error) {
    return <ErrorState error={state.error} />
  }

  if (!state.content) {
    return <ErrorState error="No content available" />
  }

  const lineCount = state.content.split('\n').length

  // Markdown view with toggle
  if (isMarkdown) {
    return (
      <div className="w-full space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-chart-1/20 text-chart-1 border-0 text-xs">
              Markdown
            </Badge>
            <Badge variant="outline" className="text-xs">
              {lineCount} lines
            </Badge>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'code' | 'preview')}>
            <TabsList className="h-8 bg-background/50 border border-border/50">
              <TabsTrigger value="preview" className="h-7 px-2 sm:px-3 text-xs gap-1">
                <Eye className="h-3 w-3" />
                <span className="hidden xs:inline">Preview</span>
              </TabsTrigger>
              <TabsTrigger value="code" className="h-7 px-2 sm:px-3 text-xs gap-1">
                <Code className="h-3 w-3" />
                <span className="hidden xs:inline">Source</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {viewMode === 'preview' ? (
          <div className="rounded-lg border border-border/50 bg-background/50 p-4 sm:p-6 max-h-[50vh] sm:max-h-[60vh] overflow-auto prose prose-sm sm:prose-base prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-pre:overflow-x-auto prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-p:break-words prose-a:break-all">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {state.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="max-h-[50vh] sm:max-h-[60vh] overflow-auto rounded-lg border border-border/50">
            <div ref={containerRef} className="min-w-0">
              <CodeMirror
                value={state.content}
                width="100%"
                extensions={[getLanguageExtension('markdown')]}
                editable={false}
                theme="dark"
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: false,
                  highlightActiveLine: false,
                  foldGutter: true,
                }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Standard code view
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-muted/50 text-xs">
          {language}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {lineCount} lines
        </Badge>
      </div>
      <div className="max-h-[50vh] sm:max-h-[60vh] overflow-auto rounded-lg border border-border/50">
        <div
          ref={containerRef}
          className="min-w-0 overflow-x-auto"
        >
          <CodeMirror
            value={state.content}
            width="100%"
            extensions={[getLanguageExtension(language)]}
            editable={false}
            theme="dark"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: false,
              highlightActiveLine: false,
              foldGutter: true,
            }}
          />
        </div>
      </div>
    </div>
  )
}
