# Emberly Status

The status page for [Emberly](https://embrly.ca), live at **[emberlystat.us](https://emberlystat.us)**. Next.js + Prisma/Postgres, with a built-in monitor runner, incidents, scheduled maintenance, subscriber notifications, alerting and an admin panel.

Emberly reads this page's `/api/status/summary` endpoint to power the live status indicator in its footer.

For setting up components and monitors for Emberly, see **[docs/emberly-setup.md](docs/emberly-setup.md)**.

## Local development

```bash
bun install            # runs prisma generate
bun run prisma:deploy  # creates the schema in your DATABASE_URL
bun run dev            # http://localhost:4000
```

Useful scripts:

```bash
bun run check          # format:check + biome:check
bun run fix            # format + biome:fix
bun run prisma:studio  # inspect the database
bun run cron:monitors  # trigger one monitor run by hand
```

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string. Must be reachable from inside the container. |
| `NEXTAUTH_URL` | Yes | Public URL, e.g. `https://emberlystat.us`. Not `localhost`, or sign-in callbacks break. |
| `NEXTAUTH_SECRET` | Yes | Random string: `openssl rand -hex 32`. |
| `NEXT_PUBLIC_STATUS_URL` | Yes | Public URL of this status page, e.g. `https://emberlystat.us`. Used in links, emails, social cards and the sitemap. |
| `NEXT_PUBLIC_EMBERLY_URL` | No | The Emberly site this page reports on. Defaults to `https://embrly.ca`. |
| `CRON_SECRET` | Yes | Bearer token protecting `/api/cron/run-monitors`. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Yes | Outbound email: account verification, password resets and subscriber notifications. |
| `DEFAULT_FROM_NAME` / `DEFAULT_FROM_EMAIL` | Yes | Sender identity, e.g. `Emberly Status` / `status@embrly.ca`. |
| `MONITOR_SCHEDULER` | No | Set to `false` to disable the built-in 30-second monitor scheduler and trigger `/api/cron/run-monitors` yourself. |
| `SMTP_SECURE` / `SMTP_IGNORE_TLS` / `SMTP_TLS_REJECT_UNAUTHORIZED` | No | Only needed to override SMTP TLS defaults. |

`NEXT_PUBLIC_*` values are baked in at build time, so rebuild after changing them.

## Deploying on Dokploy

1. **Database.** Create a PostgreSQL service in the same Dokploy project and copy its internal connection URL.
2. **Application.** Create an application from this repository. The included `railpack.json` builds it with Railpack and runs `prisma migrate deploy` before starting, so the schema is created and kept up to date on every deploy.
3. **Environment.** Add the variables above. `DATABASE_URL` should use the database's internal hostname.
4. **Domain.** Add `emberlystat.us` on port `3000` with HTTPS (Let's Encrypt). If Cloudflare proxies the domain, use SSL mode **Full (strict)**.
5. **Deploy**, then open the site and **sign up**. The first account created becomes the super admin, and it needs a verified email, so SMTP must work first.

Monitors run automatically: the app starts a built-in scheduler on boot that ticks every 30 seconds, and each monitor is checked on its own interval. Run a single replica, or set `MONITOR_SCHEDULER=false` on all but one.

### Without the built-in scheduler

If you'd rather schedule checks externally (for example with a Dokploy scheduled job), set `MONITOR_SCHEDULER=false` and call the route every minute:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://emberlystat.us/api/cron/run-monitors
```

## Public API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/status` | Full status: groups, components, uptime, incidents, maintenance, history. |
| `GET /api/status/summary` | Small snapshot for embedding: overall indicator, active incidents and maintenance. CORS-enabled, cached for 30 seconds. |
| `GET /api/status/health` | Health of the status page itself (database, auth, email). |

`indicator` is one of `NONE` (all operational), `MINOR`, `MAJOR` or `CRITICAL`.
