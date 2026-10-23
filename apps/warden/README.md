# Warden

**Warden** is the Emberly Discord server's own bot (this repo: `emberly-mod-bot`): live platform status as its presence, docs and FAQ answers, moderation, AutoMod and server logs.

It's separate from the public **Emberly** bot (`emberly-bot`), which anyone can invite and which handles account commands (`/link`, `/files`, `/shorten`, …), levels and linked roles. This one only runs in the Emberly server.

## Features

**Presence.** Polls `emberlystat.us` every minute and shows the result as the bot's status:

| Platform | Bot status | Custom status |
| --- | --- | --- |
| All systems operational | Online | 🟢 All systems operational |
| Minor issue | Idle | 🟡 *status description* |
| Maintenance in progress | Idle | 🛠️ Maintenance in progress |
| Major or critical outage | Do Not Disturb | 🔴 *status description* |

**Commands**

| Command | Who | What it does |
| --- | --- | --- |
| `/docs [topic] [for]` | Everyone | Links a docs page (autocompletes) and optionally pings someone |
| `/faq question [for]` | Everyone | Posts a common answer (autocompletes) |
| `/status` | Everyone | Status of every component, active incidents and maintenance |
| `/roles` | Everyone | How to connect Emberly and claim linked roles |
| `/links` | Everyone | Website, docs, status, pricing, GitHub, support contacts |
| `/purge amount [user]` | Manage Messages | Bulk-deletes recent messages, optionally from one user |
| `/warn user reason` | Moderate Members | DMs a warning and logs it |
| `/timeout user duration [reason]` | Moderate Members | Times a member out |
| `/untimeout user [reason]` | Moderate Members | Removes a timeout |
| `/kick user reason` | Kick Members | Kicks a member |
| `/ban user reason [delete_days]` | Ban Members | Bans a member |

Moderation commands are hidden from members without the permission, and refuse to act on anyone whose top role is at or above the moderator's own (the server owner is exempt). Server admins can change who sees them under **Server Settings → Integrations**.

**AutoMod** (skips anyone with Manage Messages):

- Deletes links to known scam and malware sites ([`malicious_domains.txt`](./malicious_domains.txt)) and times the sender out for 10 minutes
- Deletes invite links to other servers
- Deletes messages with 5+ mentions or `@everyone`, and times the sender out for 10 minutes
- Deletes the same message posted 4 times within 10 seconds, and times the sender out for 10 minutes

**Auto-answers.** In the channels listed in `SUPPORT_CHANNEL_IDS`, questions that clearly match an FAQ (custom domains, ShareX setup, upload tokens, upload limits, verification emails, embeds, billing, and so on) get the FAQ as a reply. Each answer posts at most once per channel every 10 minutes.

Everything the bot does to a member is recorded in `MOD_LOG_CHANNEL_ID`.

**Event log** (`EVENT_LOG_CHANNEL_ID`, or the mod log if unset):

- Joins (with account age; accounts under 7 days are flagged), leaves, accepting the rules
- Nickname changes, roles added or removed (including linked roles), timeouts set or lifted
- Bans and unbans made outside the bot
- Deleted messages (content and attachments), edited messages (before and after), bulk deletes
- Channels, threads and roles created or deleted; invites created or deleted
- Voice joins, leaves and moves

Actions the bot takes itself (AutoMod, moderation commands) are logged once in the mod log and not repeated in the event log. Deleted and edited messages show their content only if they were sent while the bot was running.

## Branding

Avatar, banner and mark are in `embrly.ca/public/branding/warden/` (regenerate with `bun run branding:warden` in embrly.ca):

- **Avatar and app icon:** `avatar-1024.png` (Developer Portal → General Information → App Icon, and Bot → Icon)
- **Profile banner:** `profile-banner-680x240.png` (Bot → Banner)
- **Mark:** `mark.svg`, the Emberly flame inside a shield

The bot uses the application's own emojis (Developer Portal → **Emojis**: `ember`, `ember_check`, `ember_cross`, `ember_warning`, `ember_shield`, `ember_loading`, `ember_link`, `ember_sparkles`, `ember_upload` from `embrly.ca/public/branding/discord/emojis`) in its messages, and falls back to standard emoji if one is missing.

## Setup

1. In the [Developer Portal](https://discord.com/developers/applications), create an application named **Warden** (not the public Emberly one), set its icon and banner from **Branding** above, then open **Bot**:
   - Copy the token into `DISCORD_TOKEN`
   - Enable **Message Content Intent** (AutoMod, auto-answers, message logs) and **Server Members Intent** (join, leave and member logs). This bot is only in one server, so Discord doesn't need to approve them
   - Turn off **Public Bot** so nobody else can add it
2. Invite the bot to the server (replace `APP_ID`):

   ```
   https://discord.com/oauth2/authorize?client_id=APP_ID&scope=bot+applications.commands&permissions=1099780156422
   ```

   This grants View Channels, Send Messages, Embed Links, Read Message History, Manage Messages, Manage Roles, Kick Members, Ban Members and Moderate Members. Invite logs also need **Manage Channels**; without it Discord doesn't send invite events and those lines are simply skipped.
3. In the server's role list, drag the bot's role **above** the roles it should be able to moderate. Discord won't let it act on anyone with a higher role.
4. Copy `.env.example` to `.env` and fill it in.

## Running

```bash
# Locally (Go 1.23+)
set -a && . ./.env && set +a
go run .

# Docker
docker build -t warden .
docker run --env-file .env --restart unless-stopped warden
```

In Dokploy, deploy this folder as a Dockerfile application with the variables from `.env.example`. It needs no ports, volumes or database.

## Editing answers

Docs links and FAQ answers live in [`content.go`](./content.go). Each FAQ's `Triggers` decide when it's posted automatically. Keep them specific, and add a case to `bot_test.go` whenever you add one: `go test ./...` also checks that ordinary chat doesn't trigger an answer.

Blocked domains live in [`malicious_domains.txt`](./malicious_domains.txt), one per line. A domain also blocks its subdomains.
