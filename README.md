# Emberly

Emberly is a self-hostable platform for file sharing, short links and pastes. Run your own instance with Docker in a few minutes, or use the hosted service at [embrly.ca](https://embrly.ca).

[![CI](https://github.com/EmberlyOSS/Emberly/actions/workflows/ci.yml/badge.svg)](https://github.com/EmberlyOSS/Emberly/actions/workflows/ci.yml) [![CodeQL](https://github.com/EmberlyOSS/Emberly/actions/workflows/codeql.yml/badge.svg)](https://github.com/EmberlyOSS/Emberly/actions/workflows/codeql.yml)

## Features

- Uploads to local disk or any S3-compatible storage (AWS, R2, Backblaze, RustFS, MinIO), with chunked uploads for large files
- Public, private and password-protected files, expiring links and rich link previews
- Short links and code pastes with syntax highlighting
- OCR search over uploaded images
- ShareX, Flameshot and [Flicker](https://github.com/EmberlyOSS/Flicker) desktop app support, plus a REST API
- Admin panel with user management, reports, audit logs and system health
- Two-factor authentication, sessions and API keys

## Self-hosting

```bash
git clone https://github.com/EmberlyOSS/Emberly.git
cd Emberly
cp .env.example .env    # set APP_URL and AUTH_SECRET
docker compose up -d
```

Open your `APP_URL` and the setup wizard creates the first admin account. Uploads are kept in a Docker volume, and database migrations run automatically on every start.

- **S3 storage out of the box:** `docker compose -f compose.yaml -f compose.s3.yaml up -d` adds a RustFS server.
- **Dokploy:** a one-click template lives in [`dokploy`](dokploy).
- **Without Docker:** `bun install`, `bun run db:deploy`, `bun run build` and `bun run start`. Railpack and Nixpacks configs are included.

The full guide, including every setting, is at [docs.embrly.ca](https://docs.embrly.ca/self-hosting).

## Development

You'll need [Bun](https://bun.sh/) 1.3, Node.js 24, PostgreSQL and Redis.

```bash
bun install
cp .env.example .env
bun run db:migrate
bun run dev           # the dashboard on http://localhost:3000
bun run dev:all       # every app
```

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `bun run typecheck` | Type-check every app                      |
| `bun run test`      | Run the tests                             |
| `bun run build:all` | Production build of every app             |
| `bun run worker`    | Run background jobs as a separate process |
| `bun run db:studio` | Browse the database                       |

## Repository

```
apps/
  dashboard/    The Emberly app: dashboard, file pages, API and admin panel
  docs/         docs.embrly.ca
  bot/          The Emberly Discord app
packages/
  config/       Shared TypeScript and Tailwind config, and the Ember theme
  db/           Prisma schema, migrations and client
dokploy/        Dokploy one-click template
```

Self-hosted instances only run `apps/dashboard`. The other apps power the hosted Emberly service.

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md). Please report security issues privately as described in [SECURITY.md](.github/SECURITY.md).

## Support

- [Discord](https://discord.gg/36spBmzZVB)
- [hey@embrly.ca](mailto:hey@embrly.ca)

## License

Emberly is licensed under the [Elastic License 2.0](LICENSE). You can use, modify and self-host it, including for your business. You may not offer it to others as a hosted service, or get around its license keys. Releases before the switch remain available under the GNU AGPL v3.

White-label branding and hosted (cloud) features are available with a license key from [licenses.embrly.ca](https://licenses.embrly.ca). See [License & Branding](https://docs.embrly.ca/self-hosting/licensing) for what each license includes.
