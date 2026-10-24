# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.14-alpine AS bun

FROM node:22-alpine AS runtime
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json ./
RUN bun install --ignore-scripts
COPY . .
RUN node_modules/.bin/prisma generate --no-hints && node node_modules/next/dist/bin/next build
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node node_modules/next/dist/bin/next start"]
