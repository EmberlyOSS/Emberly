# typecheck

Run TypeScript type checking across the entire project without emitting files.

```bash
bun run typecheck
```

If there are errors, fix them before considering any task complete. Pay attention to:

- Prisma model field names (regenerate the client with `bun run db:generate` if model types are stale)
- Import path aliases (`@/packages/lib/...` not relative paths)
- `unknown` vs `any` — prefer narrowing over casting
