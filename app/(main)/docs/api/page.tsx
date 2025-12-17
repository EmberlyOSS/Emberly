import { Metadata } from 'next'
import PageShell from '@/packages/components/layout/PageShell'
import MarkdownRenderer from '@/packages/components/docs/MarkdownRenderer'

export const metadata: Metadata = {
  title: 'API Reference | Emberly',
  description: 'Comprehensive API documentation for Emberly, including file uploads, short URLs, user management, and more.',
}

export default function ApiReference() {
  const markdown = `> Authentication uses NextAuth session cookies in the browser. API clients can pass \`Authorization: Bearer <uploadToken>\` for some upload flows (chunked upload finalize).

## Authentication
Handled via NextAuth at \`/api/auth/[...nextauth]\`. Browser requests use the session cookie. For API clients, some endpoints accept an \`Authorization: Bearer <uploadToken>\` header (e.g. chunked upload completion).

## Files
Endpoints for uploading, streaming, and managing files.

### Single-file upload
POST \`/api/files\` (multipart/form-data). Requires authentication (session).

Form fields: \`file\`, optional \`visibility\`, \`password\`, \`expiresAt\`.

\`\`\`bash
curl -X POST -F "file=@/path/to/file" -b "next-auth.session-token=..." https://your.instance/api/files
\`\`\`

### Quick reference
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /api/files | session | Single-file multipart upload (form-data). |
| POST | /api/files/chunks | session | Initialize chunked upload. |
| POST | /api/files/chunks/[id]/complete | session or uploadToken | Finalize multipart upload. |
| GET | /api/files/[...path] | public/private | Stream or download file (range support). |

### Chunked/multipart upload
1. POST \`/api/files/chunks\` with a small JSON body to initialize the upload. Returns \`uploadId\` and \`fileKey\`. (auth: session)
2. GET presigned part URLs at \`/api/files/chunks/[uploadId]/part/[partNumber]\` (auth: session) — response contains a presigned URL for the client to PUT the chunk directly to storage.
3. PUT uploaded parts to storage using the presigned URLs returned in step 2.
4. POST \`/api/files/chunks/[uploadId]/complete\` to finalize the upload and create the file record. Accepts assembled parts list and optional \`expiresAt\`. Auth: session **or** \`Authorization: Bearer <uploadToken>\`.

**Example: initialize request**

\`\`\`json
{
  "filename": "big.bin",
  "mimeType": "application/octet-stream",
  "size": 10485760
}
\`\`\`

**Example: complete request**

\`\`\`json
{
  "parts": [
    { "partNumber": 1, "ETag": "etag-value" },
    { "partNumber": 2, "ETag": "etag-value-2" }
  ],
  "expiresAt": "2025-12-01T00:00:00.000Z"
}
\`\`\`

\`\`\`bash
# initialize upload
curl -X POST \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=..." \
  -d '{"filename":"big.bin","mimeType":"application/octet-stream","size":10485760}' \
  https://your.instance/api/files/chunks
\`\`\`

**Example: finalize response**

\`\`\`json
{
  "url": "https://your.instance/uploads/abc123/big.bin",
  "name": "big.bin",
  "size": 10485760,
  "type": "application/octet-stream"
}
\`\`\`

### Stream & download
- GET \`/api/files/[...path]\` — streams the file (supports range requests). Use query \`?download=true\` to force attachment. Password-protected files require \`password\` query or POST body. Public/private access enforced based on file visibility and ownership.
- GET \`/api/files/:id/download\` — redirects to storage provider download URL when available or streams the file and increments download counter.

### Manage files
- GET \`/api/files\` — list files for authenticated user (paging, search, filters).
- PATCH \`/api/files/:id\` — update visibility/password (auth: owner).
- DELETE \`/api/files/:id\` — delete file (auth: owner).

## Short URLs
- POST \`/api/urls\` — create a short URL. Body: \`{"url":"https://..."}\`. Auth: session.

**Example: create URL request**

\`\`\`json
{
  "url": "https://example.com/path"
}
\`\`\`

**Example: create URL response**

\`\`\`json
{
  "id": "uuid",
  "shortCode": "Ab3dE1",
  "targetUrl": "https://example.com/path",
  "createdAt": "2025-11-25T12:00:00.000Z",
  "clicks": 0,
  "userId": "user-uuid"
}
\`\`\`

- GET \`/api/urls\` — list user's URLs. Auth: session.
- DELETE \`/api/urls/:id\` — delete (auth: owner).

## Blog (CMS)
- GET \`/api/posts\` — list posts. Query: \`?page=&limit=&all=true\`. Public lists published posts; \`all=true\` requires admin.
- GET \`/api/posts?slug=...\` — fetch by slug (public). Admins can pass \`?admin=true\` to fetch drafts.
- POST \`/api/posts\` — create post (admin only). Body: \`{"slug":"my-post","title":"Title","content":"...","excerpt":"...","status":"DRAFT|PUBLISHED","publishedAt":"2025-11-25T00:00:00Z"}\`.
- GET/PUT/DELETE \`/api/posts/:id\` — operate on a post (PUT/DELETE require admin).

## Custom Domains
- POST \`/api/domains\` — add domain. Auth: session. Domain will be created and may require DNS verification before Cloudflare provisioning.
- POST \`/api/domains/[id]/cf-check\` — server-side DNS verification and Cloudflare hostname creation (auth: session).
- GET \`/api/domains\` — list domains for the current user.

## Users & Profile
- GET/POST/PUT \`/api/users\` — admin-only user listing and management.
- PUT \`/api/profile\` — update profile (auth: session). Fields: name, email, password change (currentPassword + newPassword), image, preferences.
- DELETE \`/api/profile\` — delete account (auth: session).
- POST \`/api/profile/upload-token\` — issue upload tokens (used by some upload flows).

**Example: update profile request**

\`\`\`json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "currentPassword": "oldpass",
  "newPassword": "newsecurepass"
}
\`\`\`

**Example: profile response**

\`\`\`json
{
  "id": "user-uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "image": null,
  "randomizeFileUrls": false,
  "enableRichEmbeds": true
}
\`\`\`

## Misc
- GET \`/api/health\` — health check (no auth).
- GET \`/api/updates/check\` — update check (internal/admin usage).
- Other endpoints exist under \`app/api/\` (avatars, settings, storage types, setup, etc.). Review the route files for full details and schemas.

## Notes
- Authentication for browser-based flows uses NextAuth session cookies. Admin-protected endpoints check user role.
- Chunked uploads allow clients to upload large files via presigned URLs; the finalization endpoint accepts either the authenticated session or an \`uploadToken\` via Bearer auth.

Return to [Docs](/docs).
`

  return (
    <PageShell title="API Reference" subtitle="Comprehensive API documentation for Emberly, including file uploads, short URLs, user management, and more.">
      <section className="max-w-5xl mx-auto px-4">
        <div className="mt-6">
          <div className="prose prose-invert max-w-none">
            <MarkdownRenderer>{markdown}</MarkdownRenderer>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
