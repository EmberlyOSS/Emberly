export default function BlogHelp() {
  return (
    <div className="rounded-2xl bg-background/10 border border-border/20 p-4">
      <h4 className="text-lg font-semibold mb-2">Admin Instructions</h4>
      <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
        <li>
          Click <strong>+ New Post</strong> to open the editor. Fill in{' '}
          <em>Title</em> and a URL friendly <em>Slug</em>.
        </li>
        <li>
          Enter a short <em>Excerpt</em> (optional) and write the post content
          in Markdown.
        </li>
        <li>
          Use the <strong>Status</strong> dropdown to set the post to{' '}
          <em>Published</em> when ready. Optionally set a publish date/time.
        </li>
        <li>
          Click <strong>Create</strong> (or <strong>Update</strong>) to save.
          Published posts appear on <code>/blog</code>.
        </li>
        <li>
          To edit a post later, click <strong>Edit</strong> from the list. Use
          the preview to verify formatting.
        </li>
      </ol>

      <hr className="my-3 border-border/30" />

      <h5 className="text-sm font-semibold">Tips</h5>
      <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
        <li>Use Markdown for headings, lists, links and images.</li>
        <li>Keep excerpts concise — they appear on the blog listing.</li>
        <li>Use the preview to ensure images and embeds render correctly.</li>
      </ul>
    </div>
  )
}
