# Changelog

All notable changes to Warden are documented in this file.

The format is based on "Keep a Changelog" and follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-23

First release of **Warden**, the Emberly Discord server's own bot. It takes over moderation, server logs and support answers from the public Emberly bot, and keeps no database.

### Added

- **Status presence** — the bot's status follows [emberlystat.us](https://emberlystat.us): online when everything works, idle for minor issues or maintenance, Do Not Disturb during an outage.
- **Support commands** — `/faq` and `/docs` (both autocomplete, with an optional `for` mention), `/status` with every component, incident and maintenance, `/roles` for linked roles, and `/links`.
- **Automatic answers** — in `SUPPORT_CHANNEL_IDS`, questions that clearly match one of 12 FAQs get the answer as a reply, at most once per channel every 10 minutes. Topics: custom domains, ShareX/Flameshot, tokens, upload size, verification email, embeds, linking, linked roles, outages, billing, self-hosting and reporting issues.
- **Moderation** — `/purge`, `/warn`, `/timeout`, `/untimeout`, `/kick` and `/ban`. Moderators can't act on anyone whose top role is at or above their own.
- **AutoMod** (skips anyone with Manage Messages):
  - Links to known scam and malware sites (`malicious_domains.txt`, matched by host so subdomains count but look-alikes don't), with a 10-minute timeout
  - Invite links to other servers
  - `@everyone`/`@here` or 5+ mentions, with a 10-minute timeout
  - The same message 4 times in 10 seconds, with a 10-minute timeout
- **Mod log and event log** — every bot action, plus joins, leaves, nickname and role changes, timeouts, bans, deleted and edited messages, channels, threads, roles, invites and voice.
- **Branding** — avatar, banner and mark in `embrly.ca/public/branding/warden/`; uses the app's own `ember_*` emojis with standard fallbacks.
- Dockerfile for Dokploy, `.env.example`, README and tests (`go test ./...`).
