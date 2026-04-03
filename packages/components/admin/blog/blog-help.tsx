import { HelpCircle } from 'lucide-react'

export default function BlogHelp() {
  return (
    <div className="glass-subtle overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-muted/20">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-1/10">
          <HelpCircle className="h-4 w-4 text-chart-1" />
        </div>
        <h4 className="font-semibold">Admin Instructions</h4>
      </div>
      <div className="p-4 space-y-4">
        <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
          <li>
            Click <strong className="text-foreground">+ New Post</strong> to open the editor. Fill in{' '}
            <em>Title</em> and a URL friendly <em>Slug</em>.
          </li>
          <li>
            Enter a short <em>Excerpt</em> (optional) and write the post content
            in Markdown.
          </li>
          <li>
            Use the <strong className="text-foreground">Status</strong> dropdown to set the post to{' '}
            <em>Published</em> when ready. Optionally set a publish date/time.
          </li>
          <li>
            Click <strong className="text-foreground">Create</strong> (or <strong className="text-foreground">Update</strong>) to save.
            Published posts appear on <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs">/blog</code>.
          </li>
          <li>
            To edit a post later, click <strong className="text-foreground">Edit</strong> from the list. Use
            the preview to verify formatting.
          </li>
        </ol>

        <hr className="border-border/50" />

        <div>
          <h5 className="text-sm font-semibold mb-2">Tips</h5>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Use Markdown for headings, lists, links and images.</li>
            <li>Keep excerpts concise — they appear on the blog listing.</li>
            <li>Use the preview to ensure images and embeds render correctly.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
