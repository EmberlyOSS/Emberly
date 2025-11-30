# Multi-stage Bun-based Dockerfile
# Builder: use oven/bun to install deps & build
# Runner: minimal bun image to run the Next standalone bundle

FROM oven/bun:latest AS builder
WORKDIR /app

# Install required native build tools for some deps (Prisma, native addons)
RUN apt-get update && apt-get install -y python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package manifests first for cached installs
COPY package.json package-lock.json* bun.lockb* tsconfig.json ./
COPY prisma ./prisma

# Install deps with Bun (includes dev deps for build)
RUN bun install --ignore-scripts

# Prisma generate
RUN bunx prisma generate

# Copy rest and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN bun run build

# Runner stage
FROM oven/bun:latest AS runner
WORKDIR /app

# Create non-root user
RUN groupadd --system --gid 1001 nodejs || true \
  && useradd --system --uid 1001 --gid nodejs nextjs || true

# Utilities for healthchecks / Prisma
RUN apt-get update && apt-get install -y curl openssl && rm -rf /var/lib/apt/lists/*

# Ensure uploads directory exists with correct perms
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads && chmod 775 /app/uploads

# Copy Next standalone (if produced) and static assets
COPY --from=builder /app/.next/standalone ./.next/standalone
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib

# Copy node_modules if the bundle expects it
COPY --from=builder /app/node_modules ./node_modules

# Copy optional start script
COPY --from=builder /app/scripts/start.sh ./start.sh
RUN chmod +x /app/start.sh || true

# Set ownership
RUN chown -R nextjs:nodejs /app

# Entrypoint to fix permissions and switch user
RUN echo '#!/bin/bash' > /entrypoint.sh && \
  echo 'mkdir -p /app/uploads' >> /entrypoint.sh && \
  echo 'chown -R nextjs:nodejs /app/uploads' >> /entrypoint.sh && \
  echo 'chmod 775 /app/uploads' >> /entrypoint.sh && \
  echo 'exec su nextjs -s /bin/bash -c "${@}"' >> /entrypoint.sh && \
  chmod +x /entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/app/start.sh"]