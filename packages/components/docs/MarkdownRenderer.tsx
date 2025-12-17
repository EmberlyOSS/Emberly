import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
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
        }
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
