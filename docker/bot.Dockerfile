# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22
ARG BUN_VERSION=1.3.14

FROM oven/bun:${BUN_VERSION}-alpine AS bun

FROM node:${NODE_VERSION}-alpine AS build
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /repo
COPY package.json bun.lock ./
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY apps/dashboard/package.json apps/dashboard/
COPY apps/docs/package.json apps/docs/
COPY apps/bot/package.json apps/bot/
COPY apps/status/package.json apps/status/
COPY apps/warden/package.json apps/warden/
RUN bun install --frozen-lockfile --ignore-scripts --filter @emberly/bot
COPY apps/bot apps/bot
RUN cd apps/bot && bun run db:generate && bun run build

FROM build AS runtime
WORKDIR /repo/apps/bot
ENV NODE_ENV=production
CMD ["sh", "-c", "bun run db:deploy && node dist/index.js"]
