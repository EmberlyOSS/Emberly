# Custom Domains (Self-Hosted)

Emberly can serve uploads and short links from your own hostname. This instance uses Cloudflare SSL for SaaS. Configure DNS and Cloudflare credentials before onboarding users.

## Prerequisites
- A hostname you control (e.g. `files.example.com`).
- Cloudflare zone with SSL for SaaS enabled.
- Environment variables:
  - `CLOUDFLARE_ZONE_ID`
  - `CLOUDFLARE_API_TOKEN` (or `CLOUDFLARE_ZONE_API_TOKEN`)
  - `CNAME_TARGET` (optional; defaults to `cname.emberly.site`) — the target your users should point their CNAME at.

Restart the app after setting these values.

## DNS requirements
1. Create a CNAME from your hostname to the target configured in `CNAME_TARGET` (default `cname.emberly.site`).
2. Wait for DNS to propagate. The verification endpoint returns `409` while the CNAME is missing or incorrect.

## Add and verify a domain
1. Add the domain via the dashboard (Domains) or API `POST /api/domains`.
2. Click **Verify** (or call `POST /api/domains/:id/cf-check`). The server will:
   - Check for the CNAME pointing at `CNAME_TARGET`.
   - Create or reuse a Cloudflare Custom Hostname for the domain.
3. When Cloudflare reports an active status, the domain is ready. The UI will slow retry on errors with exponential backoff.

## Troubleshooting
- **CNAME missing/incorrect (409)**: Fix the CNAME record to point at the expected target and retry.
- **Cloudflare 7003/7000**: Your Cloudflare account lacks SSL for SaaS. Enable it or contact Cloudflare support.
- **Proxy/Orange-cloud**: Disable proxying during verification if certificates fail to issue.

## Removal
Delete the domain from the dashboard or call `DELETE /api/domains/:id`. Remove the CNAME in your DNS provider if you no longer use the hostname.
