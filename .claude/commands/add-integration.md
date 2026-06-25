# add-integration

Add a new third-party integration (API key / credentials) to Emberly's configuration system.

## What to do

1. **Add the Zod schema** in `packages/lib/config/index.ts` under `settings.integrations`:

   ```ts
   myservice: z.object({
     apiKey: z.string().optional().default(''),
   }).passthrough().optional().default({}),
   ```

2. **Add the default value** in the `DEFAULT_CONFIG` object in the same file:

   ```ts
   myservice: { apiKey: '' },
   ```

3. **Create the API client** at `packages/lib/storage/providers/myservice.ts` (for storage providers)
   or `packages/lib/myservice/index.ts` for other services, following the same auth pattern as
   `packages/lib/storage/providers/vultr.ts`:
   - Read credentials via `getIntegrations()` with env var fallback
   - Validate and build URLs safely before fetching

4. **Wire up the admin UI** — the settings manager (`packages/components/admin/settings/settings-manager.tsx`)
   has sections per integration. Add an API key input field and a test button following the
   existing Vultr pattern.

5. **Document the env var fallback** in `.env.template` as a comment.
