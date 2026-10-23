import React from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSanitize from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

export default function MarkdownRenderer({ children }: { children: string }) {
  const components: Components = {
    img: (props) => (
      <img
        src={props.src as string}
        alt={(props.alt as string) || ''}
        className="rounded-md mx-auto my-4 max-w-full"
      />
    ),
    code: ({ inline, className, children, ...props }) => {
      if (inline)
        return (
          <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
            {children}
          </code>
        )
      return (
        <pre className="bg-surface p-4 rounded-md overflow-auto my-4">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      )
    },
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto -mx-2 px-2 my-4">
        <table className="min-w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-background/80" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, isHeader: _isHeader, ...props }) => (
      <th
        className="px-3 py-2 text-left text-sm font-semibold border-b border-border/50 dark:border-border/20 whitespace-nowrap"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, isHeader: _isHeader, ...props }) => (
      <td
        className="px-3 py-2 text-sm border-b border-border/50 dark:border-border/20"
        {...props}
      >
        {children}
      </td>
    ),
    tr: ({ children, isHeader: _isHeader, ...props }) => (
      <tr className="hover:bg-background/90 transition-colors" {...props}>
        {children}
      </tr>
    ),
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeSanitize,
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      ]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}
