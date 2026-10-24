# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.14-alpine AS bun

FROM node:24-alpine AS build
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 BUILD_STANDALONE=1
COPY package.json ./
RUN bun install --ignore-scripts
COPY . .
RUN node_modules/.bin/fumadocs-mdx && node node_modules/next/dist/bin/next build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
