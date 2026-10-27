# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24
ARG BUN_VERSION=1.3.14
ARG PRISMA_VERSION=7.10.1

FROM oven/bun:${BUN_VERSION}-alpine AS bun

FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache openssl
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json bun.lock ./
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY apps/dashboard/package.json apps/dashboard/
COPY apps/docs/package.json apps/docs/
COPY apps/bot/package.json apps/bot/
RUN bun install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY turbo.json ./
COPY packages packages
COPY apps/dashboard apps/dashboard
COPY LICENSE THIRD_PARTY_NOTICES.md ./
COPY scripts scripts
ENV BUILD_STANDALONE=1
RUN bun run --cwd packages/db db:generate \
 && bun run --cwd apps/dashboard build

FROM build AS worker
WORKDIR /repo/apps/dashboard
ENV NODE_ENV=production
CMD ["bun", "scripts/worker.ts"]

FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache openssl
ARG PRISMA_VERSION
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATA_DIR=/data \
    EMBERLY_RUN_EVENT_WORKER=true

RUN addgroup -S emberly && adduser -S emberly -G emberly \
 && mkdir -p /data && chown emberly:emberly /data

COPY --from=build /repo/packages/db/prisma /app/migrate/prisma
COPY --from=build /repo/packages/db/prisma.config.ts /app/migrate/prisma.config.ts
RUN cd /app/migrate \
 && npm init -y >/dev/null \
 && npm install --no-audit --no-fund --omit=dev prisma@${PRISMA_VERSION} dotenv@17.4.2 >/dev/null \
 && chown -R emberly:emberly /app/migrate

COPY --from=build --chown=emberly:emberly /repo/apps/dashboard/.next/standalone ./
COPY --from=build --chown=emberly:emberly /repo/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=build --chown=emberly:emberly /repo/apps/dashboard/public ./apps/dashboard/public
COPY --chmod=755 apps/dashboard/docker-entrypoint.sh /usr/local/bin/emberly-entrypoint
COPY LICENSE THIRD_PARTY_NOTICES.md ./
COPY --from=build /repo/apps/dashboard/public/licenses/packages.txt ./THIRD_PARTY_LICENSES.txt

USER emberly
VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO /dev/null "http://127.0.0.1:${PORT}/api/health" || exit 1

ENTRYPOINT ["emberly-entrypoint"]
CMD ["node", "apps/dashboard/server.js"]
