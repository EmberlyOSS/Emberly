# Emberly

Emberly is an open-source self hosted file sharing and shortlinking platform built with Next.js and TypeScript.

This repository contains both the frontend and backend (Next.js app router), Prisma schema and server-side API routes.

## Quickstart (developer)

Requirements: Node.js (18+), Docker (optional), and npm.

1. Install dependencies:

```powershell
npm install
```

2. (Optional) Start a local Postgres DB:

```powershell
docker run --name emberly-db -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 postgres:16
```

3. Copy environment file:

```powershell
cp .env.example .env
# Edit .env and set DATABASE_URL, NEXTAUTH_SECRET, etc.
```

4. Run migrations:

```powershell
npx prisma migrate dev
```

5. Start dev server:

```powershell
npm run dev
```

## Contributing

See `CONTRIBUTING.md` for guidelines on contributing, coding standards, and the PR process.

## License & Code of Conduct

Refer to the repository license and `CONTRIBUTING.md` for the code of conduct.

If you have questions, open an issue or reach out to the maintainer `@CodeMeAPixel` on GitHub.
