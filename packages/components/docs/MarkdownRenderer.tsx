import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSanitize from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

export default function MarkdownRenderer({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize, rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]}
      components={{
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt || ''} className="rounded-md mx-auto my-4 max-w-full" />
        ),
        code: ({ node, inline, className, children, ...props }) => {
          if (inline) return <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
          return (
            <pre className="bg-surface p-4 rounded-md overflow-auto my-4">
              <code className={className} {...props}>{children}</code>
            </pre>
          )
        },
        // Wrap tables in a scrollable container for mobile responsiveness
        table: ({ children, ...props }) => (
          <div className="overflow-x-auto -mx-2 px-2 my-4">
            <table className="min-w-full border-collapse" {...props}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children, ...props }) => (
          <thead className="bg-white/5 dark:bg-black/10" {...props}>
            {children}
          </thead>
        ),
        th: ({ children, ...props }) => (
          <th className="px-3 py-2 text-left text-sm font-semibold border-b border-white/10 dark:border-white/5 whitespace-nowrap" {...props}>
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td className="px-3 py-2 text-sm border-b border-white/10 dark:border-white/5" {...props}>
            {children}
          </td>
        ),
        tr: ({ children, ...props }) => (
          <tr className="hover:bg-white/5 dark:hover:bg-white/[0.02] transition-colors" {...props}>
            {children}
          </tr>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
