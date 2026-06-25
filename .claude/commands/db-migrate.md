# db-migrate

Run a Prisma migration for the current schema changes.

## Steps

1. Ask the user for a short migration name that describes what changed (e.g. `add-object-storage-pool`, `add-user-avatar-field`).
2. Run the migration:
   ```bash
   bun run db:migrate --name <migration-name>
   ```
3. Run `bun run db:generate` to update the Prisma client.
4. Report the new migration file created under `prisma/migrations/`.

If `bun run db:migrate` fails due to a destructive change (dropping a column, renaming), explain the impact and ask whether to proceed with `--create-only` so the SQL can be reviewed first.
