# lint

Run ESLint across the project and auto-fix what can be fixed.

```bash
bun run lint:fix
```

Then verify no remaining errors:

```bash
bun run lint
```

Key rules to be aware of:

- `@typescript-eslint/no-explicit-any` is a **warning** (not error) — minimise `any` but don't panic.
- `react/no-unescaped-entities` is **off** — apostrophes in JSX are fine.
- `@next/next/no-img-element` is **off** — `<img>` is allowed.
- Unused variables are warned if not prefixed with `_`.
