import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'
import DocsAlert from '@/components/docs/DocsAlert'
import EndpointTable from '@/components/docs/EndpointTable'


import { Metadata } from 'next'
import PageShell from '@/components/layout/PageShell'

export const metadata: Metadata = {
  title: 'API Reference | Emberly',
  description: 'Comprehensive API documentation for Emberly, including file uploads, short URLs, user management, and more.',
}

export default function ApiReference() {
  return (
    <PageShell title="API Reference" subtitle="Comprehensive API documentation for Emberly, including file uploads, short URLs, user management, and more.">
      <section className="max-w-5xl mx-auto px-4">
        <div className="mt-6 space-y-6">
          <DocsAlert title="Authentication">
            Browser-based authentication uses NextAuth session cookies. API
            clients may use <code>Authorization: Bearer &lt;uploadToken&gt;</code>
            for some upload flows (chunked upload finalize).
          </DocsAlert>
          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium">Authentication</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Authentication is handled via NextAuth at{' '}
                <code>/api/auth/[...nextauth]</code>. Browser requests use the
                NextAuth session cookie. For API clients, some endpoints accept
                an <code>Authorization: Bearer &lt;uploadToken&gt;</code> header
                (e.g. chunked upload completion).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium">Files</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Endpoints for uploading, streaming, and managing files.
              </p>

              <div className="mt-3">
                <div className="font-medium">Single-file upload</div>
                <div className="text-sm text-muted-foreground">
                  POST <code>/api/files</code> (multipart/form-data). Requires
                  authentication (session). Form fields: <code>file</code>,
                  optional <code>visibility</code>, <code>password</code>, and{' '}
                  <code>expiresAt</code>.
                </div>
                <pre className="mt-2 rounded bg-background/30 p-3 text-xs whitespace-pre overflow-x-auto max-w-full">
                  curl -X POST -F "file=@/path/to/file" -b
                  "next-auth.session-token=..." https://your.instance/api/files
                </pre>
              </div>

              <div className="mt-4">
                <div className="font-medium mb-2">Quick reference</div>
                <EndpointTable
                  rows={[
                    { method: 'POST', path: '/api/files', auth: 'session', description: 'Single-file multipart upload (form-data).' },
                    { method: 'POST', path: '/api/files/chunks', auth: 'session', description: 'Initialize chunked upload.' },
                    { method: 'POST', path: '/api/files/chunks/[id]/complete', auth: 'session or uploadToken', description: 'Finalize multipart upload.' },
                    { method: 'GET', path: '/api/files/[...path]', auth: 'public/private', description: 'Stream or download file (range support).' },
                  ]}
                />
              </div>

              <div className="mt-3">
                <div className="font-medium">Chunked/multipart upload</div>
                <div className="text-sm text-muted-foreground">Flow:</div>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground">
                  <li>
                    POST <code>/api/files/chunks</code> with a small JSON body
                    to initialize the upload. Returns <code>uploadId</code> and{' '}
                    <code>fileKey</code>. (auth: session)
                  </li>
                  <li>
                    GET presigned part URLs at{' '}
                    <code>/api/files/chunks/[uploadId]/part/[partNumber]</code>{' '}
                    (auth: session) — the response contains a presigned URL for
                    the client to PUT the chunk directly to storage.
                  </li>
                  <li>
                    PUT uploaded parts to storage using the presigned URLs
                    returned in step 2.
                  </li>
                  <li>
                    POST <code>/api/files/chunks/[uploadId]/complete</code> to
                    finalize the upload and create the file record. This
                    endpoint accepts the assembled parts list and optional{' '}
                    <code>expiresAt</code>. Auth: session OR{' '}
                    <code>Authorization: Bearer &lt;uploadToken&gt;</code>.
                  </li>
                </ol>

                <div className="mt-2 text-sm text-muted-foreground">
                  <div className="font-medium">Example: initialize request</div>
                  <pre className="mt-2 rounded bg-background/30 p-3 text-xs whitespace-pre overflow-x-auto max-w-full">{`{
    "filename": "big.bin",
    "mimeType": "application/octet-stream",
    "size": 10485760
}`}</pre>

                  <div className="font-medium mt-2">
                    Example: complete request
                  </div>
                  <pre className="mt-2 rounded bg-background/30 p-3 text-xs whitespace-pre overflow-x-auto max-w-full">{`{
    "parts": [
        { "partNumber": 1, "ETag": "etag-value" },
        { "partNumber": 2, "ETag": "etag-value-2" }
    ],
    "expiresAt": "2025-12-01T00:00:00.000Z"
}`}</pre>
                </div>
                <pre className="mt-2 rounded bg-background/30 p-3 text-xs whitespace-pre overflow-x-auto max-w-full">{`# initialize upload
curl -X POST -H "Content-Type: application/json" -b "next-auth.session-token=..." -d '{"filename":"big.bin","mimeType":"application/octet-stream","size":10485760}' https://your.instance/api/files/chunks`}</pre>
                <div className="mt-3">
                  <div className="font-medium">Example: finalize response</div>
                  <pre className="mt-2 rounded bg-background/30 p-3 text-xs whitespace-pre overflow-x-auto max-w-full">{`{
                "url": "https://your.instance/uploads/abc123/big.bin",
                "name": "big.bin",
                "size": 10485760,
                "type": "application/octet-stream"
              }`}</pre>
                </div>
              </div>

              <div className="mt-3">
                <div className="font-medium">Stream & download</div>
                <div className="text-sm text-muted-foreground">
                  GET <code>/api/files/[...path]</code> — streams the file
                  (supports range requests). Use query{' '}
                  <code>?download=true</code> to force attachment.
                  Password-protected files require <code>password</code> query
                  or POST body. Public/private access enforced based on file
                  visibility and ownership.
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  GET <code>/api/files/:id/download</code> — redirects to
                  storage provider download URL when available or streams the
                  file and increments download counter.
                </div>
              </div>

              <div className="mt-3">
                <div className="font-medium">Manage files</div>
                <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                  <li>
                    GET <code>/api/files</code> — list files for authenticated
                    user (supports paging, search, filters).
                  </li>
                  <li>
                    PATCH <code>/api/files/:id</code> — update
                    visibility/password (auth: owner).
                  </li>
                  <li>
                    DELETE <code>/api/files/:id</code> — delete file (auth:
                    owner).
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium">Short URLs</h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                <li>
                  POST <code>/api/urls</code> — create a short URL. Body:{' '}
                  <code>{'{"url":"https://..."}'}</code>. Auth: session.
                </li>
                <li>
                  POST <code>/api/urls</code> — create a short URL. Body:{' '}
                  <code>{'{"url":"https://..."}'}</code>. Auth: session.
                </li>
                <div className="mt-2">
                  <div className="font-medium">Example: create URL request</div>
                  <pre className="mt-2 rounded bg-background/30 p-3 text-xs whitespace-pre-wrap break-words">{`{
    "url": "https://example.com/path"
}`}</pre>
                  <div className="font-medium mt-2">
                    Example: create URL response
                  </div>
                  <pre className="mt-2 rounded bg-background/30 p-3 text-xs whitespace-pre-wrap break-words">{`{
    "id": "uuid",
    "shortCode": "Ab3dE1",
    "targetUrl": "https://example.com/path",
    "createdAt": "2025-11-25T12:00:00.000Z",
    "clicks": 0,
    "userId": "user-uuid"
}`}</pre>
                </div>
                <li>
                  GET <code>/api/urls</code> — list user's URLs. Auth: session.
                </li>
                <li>
                  DELETE <code>/api/urls/:id</code> — delete (auth: owner).
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium">Blog (CMS)</h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                <li>
                  GET <code>/api/posts</code> — list posts. Query:{' '}
                  <code>?page=&limit=&all=true</code>. Public lists published
                  posts; <code>all=true</code> requires admin.
                </li>
                <li>
                  GET <code>/api/posts?slug=...</code> — fetch by slug (public).
                  Admins can pass <code>?admin=true</code> to fetch drafts.
                </li>
                <li>
                  POST <code>/api/posts</code> — create post (admin only). Body:{' '}
                  <code>
                    {
                      '{"slug":"my-post","title":"Title","content":"...","excerpt":"...","status":"DRAFT|PUBLISHED","publishedAt":"2025-11-25T00:00:00Z"}'
                    }
                  </code>
                  .
                </li>
                <li>
                  GET/PUT/DELETE <code>/api/posts/:id</code> — operate on a post
                  (PUT/DELETE require admin).
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium">Custom Domains</h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                <li>
                  POST <code>/api/domains</code> — add domain. Auth: session.
                  Domain will be created and may require DNS verification before
                  Cloudflare provisioning.
                </li>
                <li>
                  POST <code>/api/domains/[id]/cf-check</code> — server-side DNS
                  verification and Cloudflare hostname creation (auth: session).
                </li>
                <li>
                  GET <code>/api/domains</code> — list domains for the current user.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium">Users & Profile</h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                <li>
                  GET/POST/PUT <code>/api/users</code> — admin-only user listing
                  and management.
                </li>
                <li>
                  PUT <code>/api/profile</code> — update profile (auth:
                  session). Fields: name, email, password change
                  (currentPassword + newPassword), image, preferences.
                </li>
                <li>
                  DELETE <code>/api/profile</code> — delete account (auth:
                  session).
                </li>
                <li>
                  POST <code>/api/profile/upload-token</code> — issue upload
                  tokens (used by some upload flows).
                </li>
                <div className="mt-2">
                  <div className="font-medium">
                    Example: update profile request
                  </div>
                  <pre className="mt-2 rounded bg-background/30 p-3 text-xs whitespace-pre-wrap break-words">{`{
                    "name": "Jane Doe",
                    "email": "jane@example.com",
                    "currentPassword": "oldpass",
                    "newPassword": "newsecurepass"
                }`}</pre>
                  <div className="font-medium mt-2">
                    Example: profile response
                  </div>
                  <pre className="mt-2 rounded bg-background/30 p-3 text-xs whitespace-pre-wrap break-words">{`{
                    "id": "user-uuid",
                    "name": "Jane Doe",
                    "email": "jane@example.com",
                    "image": null,
                    "randomizeFileUrls": false,
                    "enableRichEmbeds": true
                }`}</pre>
                </div>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-medium">Misc</h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                <li>
                  GET <code>/api/health</code> — health check (no auth).
                </li>
                <li>
                  GET <code>/api/updates/check</code> — update check
                  (internal/admin usage).
                </li>
                <li>
                  Other endpoints exist under <code>app/api/</code> (avatars,
                  settings, storage types, setup, etc.). Review the route files
                  for full details and precise request/response schemas.
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground">
            <p>Notes:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>
                Authentication for browser-based flows uses NextAuth session
                cookies. Admin-protected endpoints check user role.
              </li>
              <li>
                Chunked uploads allow clients to upload large files via
                presigned URLs; the finalization endpoint accepts either the
                authenticated session or an <code>uploadToken</code> via Bearer
                auth.
              </li>
            </ul>

            <p className="mt-4">
              Return to{' '}
              <Link href="/docs" className="underline">
                Docs
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
