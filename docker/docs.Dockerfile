# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22
ARG BUN_VERSION=1.3.14

FROM oven/bun:${BUN_VERSION}-alpine AS bun

FROM node:${NODE_VERSION}-alpine AS build
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1 BUILD_STANDALONE=1
COPY package.json bun.lock ./
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY apps/dashboard/package.json apps/dashboard/
COPY apps/docs/package.json apps/docs/
COPY apps/bot/package.json apps/bot/
COPY apps/status/package.json apps/status/
COPY apps/warden/package.json apps/warden/
RUN bun install --frozen-lockfile --ignore-scripts --filter @emberly/docs
COPY packages/config packages/config
COPY apps/docs apps/docs
RUN cd apps/docs && bunx fumadocs-mdx && bun run build

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build /repo/apps/docs/.next/standalone ./
COPY --from=build /repo/apps/docs/.next/static ./apps/docs/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/docs/server.js"]
