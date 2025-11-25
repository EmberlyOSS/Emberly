import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function ProfileDomains() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Domains</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You can serve files from your own domain by pointing your domain to
          <strong className="ml-1">cname.emberly.site</strong> using a CNAME
          record. For best results, enable a proxied connection at your DNS
          provider (Cloudflare or similar) and choose <em>Full</em> or
          <em>Full (strict)</em> SSL/TLS mode.
        </p>

        <div className="rounded-md bg-muted p-4 text-sm">
          <div className="font-medium mb-2">Example DNS setup</div>
          <pre className="whitespace-pre-wrap text-xs">
            {`Type: CNAME
Host: www (or @ for root via a provider that supports CNAME flattening)
Value: cname.emberly.site
Proxy: Enabled (Cloudflare proxied)
SSL/TLS: Full or Full (strict)`}
          </pre>
        </div>

        <div className="text-sm text-muted-foreground">
          <strong>Notes:</strong>
          <ul className="mt-2 ml-4 list-disc">
            <li>
              If your DNS provider does not allow CNAME at the root, use their
              CNAME flattening/ANAME/ALIAS feature or point the root to our
              provided IPs (contact the admin).
            </li>
            <li>
              Proxied (CDN) mode is recommended so Emberly can serve content
              securely and cache assets. Use Full (strict) when possible for the
              strongest security.
            </li>
            <li>
              After changing DNS, allow up to 24–48 hours for propagation. You
              may need to re-issue or wait for TLS certificates to be issued
              when first configuring the domain.
            </li>
          </ul>
        </div>

        <Separator className="my-2" />

        <div className="text-sm text-muted-foreground">
          If you need help configuring your DNS provider, open a support request
          with your domain registrar or contact the Emberly team.
        </div>
      </CardContent>
    </Card>
  )
}

export default ProfileDomains
