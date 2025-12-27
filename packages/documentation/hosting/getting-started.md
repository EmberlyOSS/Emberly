## Local development
Clone the repository and install dependencies.

```bash
git clone https://github.com/EmberlyOSS/Website.git
cd Website
# If you use Yarn (recommended for this repo):
yarn install
# Alternatively with npm:
npm install
```

Start the dev server:

```bash
yarn dev
```

## Prisma migrations
After changing `schema.prisma`, run migrations locally (development only):

```bash
npx prisma migrate dev --name descriptive-name
npx prisma generate
```

If you use Docker, apply migrations inside the container or during your CI pipeline.

## Docker Compose (quick)
A `docker-compose.yml` is included for quick deployment. Ensure environment variables are set (database URL, NEXTAUTH secret, storage config).

Important environment variables (examples):

```bash
DATABASE_URL=postgresql://user:pass@db:5432/emberly
NEXTAUTH_SECRET=your-secure-secret
STORAGE_PROVIDER=s3
```

Run:

```bash
docker-compose up -d --build
```

## Next steps
See the [API Reference](/docs/api) for endpoint details and [Legal](/legal) for privacy and security guidance.
