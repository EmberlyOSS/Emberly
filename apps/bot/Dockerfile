# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.14-alpine AS bun

FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json ./
RUN bun install --ignore-scripts
COPY . .
RUN node_modules/.bin/prisma generate && node_modules/.bin/tsc
ENV NODE_ENV=production
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/index.js"]
