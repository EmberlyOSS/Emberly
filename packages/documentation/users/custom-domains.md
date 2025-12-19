## Overview
Emberly supports serving uploads and short links from verified custom hostnames. We recommend Cloudflare for TLS automation and DNS APIs.

## DNS requirements
- Provide a CNAME record pointing your hostname (e.g. `www` or `@` when supported) to the configured CNAME target (`CNAME_TARGET` in your instance config).
- For root domains where CNAME is not possible, use an ALIAS/ANAME if supported, or use a subdomain.
- TXT records may be required for ownership verification; Emberly will show the required TXT value during add.

## Verification and Cloudflare
Emberly performs a DNS-first check to ensure the required CNAME or TXT records exist before attempting to create a Cloudflare Custom Hostname. This avoids provisioning failures and helps certificate issuance succeed.

### Endpoints
- POST `/api/domains` - add domain (auth: session). Domain starts with status `awaiting_cname`.
- POST `/api/domains/[id]/cf-check` - server verifies DNS then attempts Cloudflare provisioning (auth: session).
- GET `/api/domains` - list user's domains (auth: session).

## Troubleshooting
- Ensure DNS changes have propagated (can take minutes).
- Check your DNS provider for proxy settings; disable proxying during verification if needed.
- Confirm the CNAME target matches the instance configuration.

Return to [Docs](/docs).
