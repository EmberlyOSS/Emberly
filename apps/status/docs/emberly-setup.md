# Setting up the Emberly status page

How to configure **emberlystat.us** for Emberly: components, monitors, alerts, and the link to Emberly's footer indicator.

This assumes the status page is already deployed (see the [README](../README.md#deploying-on-dokploy)) and you've signed up as the first user, which makes you the super admin. Everything below happens in the admin panel at `https://emberlystat.us/admin`.

---

## How it fits together

```
Emberly (embrly.ca)                         Status page (emberlystat.us)
───────────────────                         ────────────────────────────
/api/health  ◄──── monitors check every 60s ──── Monitors
                                                    │ set status of
                                                    ▼
footer indicator ──► /api/status-indicator ──►  Components  ◄── Incidents / Maintenance
                     (cached 30s)               /api/status/summary
```

- **Components** are what visitors see: "File storage", "Short links" and so on, organised into groups.
- **Monitors** check something automatically and drive a linked component's status.
- **Incidents** and **maintenance** are posted by you. They override monitor-driven status and notify subscribers.
- Emberly's footer reads `/api/status/summary` and shows the overall state.

Emberly's `/api/health` endpoint does most of the work. It checks each backing service on every request and returns:

```json
{
  "data": {
    "status": "ok",
    "checks": {
      "database":    { "status": "up" },
      "redis":       { "status": "up" },
      "storage":     { "status": "up" },
      "eventQueue":  { "status": "up" }
    }
  },
  "success": true
}
```

`data.status` is `ok`, `degraded` (any subsystem down) or `down` (database unreachable, returned with HTTP 503). Each check is `up` or `down`. The storage check does a real write and delete, cached for 30 seconds.

---

## Quick start

Steps 1–3 can be done in one go. This creates the groups, components and monitors below, and skips anything that already exists:

```bash
bun run seed:emberly
```

Then come back for the monitors that need something from you first (short links, custom domains, file delivery), and for alerts (Step 4).

## Step 1: Status page settings

**Admin → Settings**

| Setting | Recommended | Why |
| --- | --- | --- |
| Home page display | **Both** | Shows components plus response-time charts. |
| Show recent history | **On**, 14 days | Recently resolved incidents stay visible for context. |

---

## Step 2: Groups and components

**Admin → Status → Components**

Create the groups first, then the components inside them. Order sets the display order, top to bottom.

| Group | Component | Description shown to visitors |
| --- | --- | --- |
| **Website** | Website & dashboard | embrly.ca, sign-in and the dashboard |
| | API | The Emberly REST API and ShareX/Flameshot uploads |
| **Files** | Uploads & storage | Uploading, storing and deleting files |
| | File delivery | Viewing and downloading shared files |
| **Links** | Short links | URL shortener redirects |
| | Custom domains | Files and links served on your own domain |
| **Platform** | Database | |
| | Cache | Sessions, rate limiting and the job queue |
| | Background jobs | Expiring files, emails and notifications |
| **Other** | Documentation | docs.embrly.ca |
| | Discord bot | |

Tips:

- **Keep component names in user terms.** Visitors care that "Uploads" are broken, not that Redis is. Put the infrastructure components (Database, Cache, Background jobs) in a group with **Default open** turned off, so they're one click away.
- **Leave "Show uptime" on** for anything with a monitor. Turn it off for components you only update by hand (Discord bot), or their uptime bar sits at 100% regardless.
- **Location** is optional. Use it if you run in more than one region (e.g. `CA · Toronto`).

---

## Step 3: Monitors

**Admin → Status → Monitors → New monitor**

Pick a **preset** to fill in the URL and the JSON check, then set the timing and the linked component. The Emberly presets all target `NEXT_PUBLIC_EMBERLY_URL/api/health` (`https://embrly.ca` by default).

| Monitor | Preset / setup | Linked component |
| --- | --- | --- |
| Website | Custom: HTTP `https://embrly.ca`, body check **None** | Website & dashboard |
| API | Custom: HTTP `https://embrly.ca/api/health`, body check **None** | API |
| Storage | **Emberly: file storage** | Uploads & storage |
| Database | **Emberly: database** | Database |
| Redis | **Emberly: Redis** | Cache |
| Background jobs | **Emberly: background jobs** | Background jobs |
| Short links | Custom: HTTP `https://embrly.ca/u/<code>` (see below) | Short links |
| Custom domain | Custom: HTTP `https://<your test domain>` | Custom domains |
| Docs | Custom: HTTP `https://docs.embrly.ca` | Documentation |
| Overall health | **Emberly: overall health** | *(none, alerts only)* |

**Timing for every monitor:**

| Field | Value | Notes |
| --- | --- | --- |
| Interval | `60` | Seconds between checks. |
| Timeout | `10` | A response slower than **80% of the timeout** (8 s here) counts as *degraded*. The form defaults to 60, which would hide slowness. |
| Down threshold | `2` | Consecutive failures before the component changes and alerts fire. Absorbs one-off blips. |

**How results affect components:** *up* sets **Operational**, and *degraded* or *down* sets **Degraded performance**. Monitors never set **Partial** or **Major outage** on their own; you declare those by opening an incident (Step 5).

### Setting up the check targets

- **Short links:** in Emberly, create a short link that points to `https://embrly.ca` and use `https://embrly.ca/u/<code>` as the target. Monitors follow redirects, so this checks the redirect service and that the destination loads.
- **Custom domains:** connect a domain you own to an Emberly account and monitor it. That exercises Cloudflare for SaaS end to end.
- **File delivery (optional):** upload a small **public** text file containing `ok` and monitor its `https://embrly.ca/api/files/<urlId>/<filename>` URL with body check **Body contains** `ok`. Only do this if Cloudflare **bypasses cache for `/api/*`**. Otherwise Cloudflare serves a cached copy and the monitor can't see outages.
- **Overall health** isn't linked to a component, because any degraded subsystem trips it, and the per-service monitors already show which one. Use it to page yourself (Step 4).

### Monitor types

- **HTTP:** a GET request. It passes on any 2xx/3xx unless you set **Expected status codes**, and you can add a body check.
- **TCP:** checks that a port accepts connections (e.g. Postgres on 5432). Use it for services that don't speak HTTP.
- **PING:** despite the name, this is an HTTP `HEAD` request to `http://<target>`, not ICMP. Prefer HTTP.

### If Cloudflare blocks the monitor

Requests come from the status page's server with the User-Agent `Emberly-StatusMonitor/1.0`. If Cloudflare's bot protection challenges them, monitors report *down* even though the site is fine. In Cloudflare, add a **WAF custom rule** for `embrly.ca`:

- **When:** `(http.user_agent contains "Emberly-StatusMonitor")`
- **Then:** Skip all remaining custom rules, Bot Fight Mode and Super Bot Fight Mode.

---

## Step 4: Alerts

**Admin → Status → Alerts**

1. **Add a channel.** Discord webhooks are the easiest: in your staff Discord, open Server settings → Integrations → Webhooks → New webhook, copy the URL, and add it here as a **Discord webhook** channel. Slack, generic webhooks and email work the same way.
2. **Add rules**, or don't. A channel with no rules receives every alert. Add rules to scope it:
   - **Overall health** → your on-call channel, events **Down** and **Up**.
   - **Platform** group → a quieter infra channel, events **Down**, **Degraded** and **Up**.

The **Certificate expiry** event exists in the form, but the monitor runner never sends it yet. Track TLS expiry another way, for now.

---

## Step 5: Incidents and maintenance

### Incidents

**Admin → Status → Incidents → New incident** when something is broken and users notice.

1. **Name** it from the user's side: "Uploads failing for some users", not "S3 503s".
2. **Set the affected components and their status** (Degraded, Partial outage or Major outage). This overrides what the monitors say while the incident is open.
3. **Post updates** as you go: *Investigating*, then *Identified*, then *Monitoring*, then *Resolved*. Each update notifies subscribers.
4. After resolving, optionally publish a **post-mortem**.

### Maintenance

**Admin → Status → Maintenances → New** for planned work. Set the start and end, the affected components and a description. Maintenance moves to *In progress* and *Completed* on its own at the scheduled times. While it's in progress, down alerts for the affected monitors are suppressed, and Emberly's footer shows **"Scheduled maintenance in progress"** in blue.

---

## Step 6: Connect Emberly's footer

Hosted Emberly reads `https://emberlystat.us` by default, so in cloud mode there's nothing to set. To point it elsewhere, or to enable it on a self-hosted instance, set this in Emberly's environment:

```env
STATUS_PAGE_URL="https://emberlystat.us"
```

Check that it's working:

```bash
curl https://emberlystat.us/api/status/summary   # the status page's snapshot
curl https://embrly.ca/api/status-indicator      # what Emberly's footer uses
```

The footer dot shows the overall state:

- **Green:** operational
- **Amber:** minor
- **Orange:** partial outage
- **Red:** major outage
- **Blue:** maintenance
- **Gray:** status page unreachable

If there's an active incident, the dot links to it; otherwise it links to the status page. Emberly caches the result for 30 seconds and keeps showing the last good value for up to two minutes if the status page is briefly unreachable.

---

## Step 7: Subscriptions

Visitors can subscribe from the status page once signed in. Their email is already verified at sign-up, so the subscription is active immediately. They can choose specific components or groups and event types. Every email has a one-click unsubscribe link.

Discord channels can subscribe too, through the API (there's no form for it yet). The call posts a confirmation message to the channel:

```bash
curl -X POST https://emberlystat.us/api/status/subscribe/webhook -H "Content-Type: application/json" -d '{"webhookUrl": "https://discord.com/api/webhooks/…"}'
```

Add `"componentIds"`, `"groupIds"` or `"events"` arrays to scope what it receives.

Make sure SMTP is configured (`SMTP_*`, `DEFAULT_FROM_*`). Without it, sign-up verification and notifications won't send.

---

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Monitors never run | The status page logs `[monitors] built-in scheduler started` on boot. If `MONITOR_SCHEDULER=false`, something external must call `/api/cron/run-monitors` with `Authorization: Bearer $CRON_SECRET`. |
| Everything shows *down* at once | Cloudflare is probably challenging the monitor; add the WAF skip rule above. Also confirm the status page's server can reach embrly.ca. |
| Background jobs always *down* | `eventQueue.status` is `disabled` when the worker runs in a separate process from the one answering `/api/health`. Either run the worker in-process (`EMBERLY_RUN_EVENT_WORKER=true` on the web service) or drop this monitor. |
| Components flap between Operational and Degraded | Raise the **timeout** (slow responses count as degraded) or the **down threshold**. |
| Footer indicator missing | `STATUS_PAGE_URL` is unset on a self-hosted instance, or `/api/status-indicator` returns `configured: false`. |
| Footer indicator stuck gray | Emberly can't reach the status page. Test with `curl` from Emberly's container. |
