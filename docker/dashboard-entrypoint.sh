#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

if [ -z "$AUTH_SECRET" ] && [ -z "$NEXTAUTH_SECRET" ]; then
  echo "AUTH_SECRET is not set. Generate one with: openssl rand -base64 32" >&2
  exit 1
fi

if [ "${EMBERLY_SKIP_MIGRATIONS:-false}" != "true" ]; then
  attempt=1
  until (cd /app/migrate && ./node_modules/.bin/prisma migrate deploy); do
    if [ "$attempt" -ge 10 ]; then
      echo "Database migrations failed after $attempt attempts" >&2
      exit 1
    fi
    echo "Database not ready, retrying in 3s ($attempt/10)"
    attempt=$((attempt + 1))
    sleep 3
  done
fi

exec "$@"
