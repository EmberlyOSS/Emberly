## Contributing to Emberly

Thanks for helping with the Emberly project this document explains how to contribute, the project's expectations, and how to get a local environment up and running.

If you're unsure where to start, check the `good-first-issue` label in Issues or open a discussion to ask for guidance.

### Code of Conduct

Be respectful and collaborative. Treat other contributors with kindness and describe changes clearly. If an interaction becomes uncomfortable, contact the maintainers (`@CodeMeAPixel`) in a GitHub issue.

### Quick process

1. Fork the repository and create a feature branch (use a descriptive branch name).
2. Implement your change and add/update tests where appropriate.
3. Run the local test/build steps below to ensure everything passes.
4. Open a Pull Request that references related issues and includes a clear description and screenshots for UI changes.

### What we expect from PRs

- Keep PRs focused and small (avoid large unrelated refactors in the same PR).
- Include tests for bug fixes and new features when reasonable.
- Update or add documentation when behaviors change.
- Explain why the change is needed in the PR description.

### AI-assisted code

AI tools can be used to help write code, but you must:

- Verify and understand any generated code before committing it.
- Clean up style/formatting to match the codebase.
- Add tests or manual verification where appropriate.

All code will be reviewed; contributors are responsible for the correctness and licensing of submitted code.

### Local development (quickstart)

Requirements: Node.js (18+ recommended), Docker (optional for Postgres), and `npm`.

1. Install dependencies:

```powershell
npm install
```

2. (Optional) Start a local Postgres database (Docker):

```powershell
docker run --name emberly-db -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 postgres:16
```

3. Copy environment file and update values:

```powershell
cp .env.example .env
# Edit `.env` and set `DATABASE_URL`, `NEXTAUTH_SECRET`, etc.
```

4. Run DB migrations (creates local dev schema):

```powershell
npx prisma migrate dev
```

5. Start the dev server:

```powershell
npm run dev
```

### Tests & build

- Run unit/type checks: `npm run lint` and `npm run test` (if tests exist).
- Build for production: `npm run build`.

If CI fails for your PR, check the pipeline logs, fix any issues locally, and push updates.

### Commit messages

We prefer clear, descriptive commit messages. Use present-tense descriptions like "Add X feature" or "Fix Y bug". If you use Conventional Commits that's fine but not required.

### PR template

Please use the provided PR template and include:

- Short description of changes
- Motivation/issue reference
- Any migration or data considerations
- Screenshots for UI changes
- Steps to test locally

### Maintainers

- `@CodeMeAPixel` — primary maintainer
- `@Miya25`- primary maintainer

### Security

If you discover a security vulnerability, please follow the instructions in `SECURITY.md`.

Thank you for contributing!
