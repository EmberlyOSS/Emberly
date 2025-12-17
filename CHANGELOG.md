# Changelog (updated)

All notable changes to this project will be documented in this file.

The format is based on "Keep a Changelog" and follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0-alpha.6-patch.1] - 2025-12-16

### Added / Changed (patch)
- Server-side 2FA endpoints: `GET/POST/DELETE /api/profile/2fa` generating TOTP secrets and QR data (uses `otplib` + `qrcode`), plus client-friendly payloads.
- Client 2FA flows: full enable flow (QR + code confirmation) and a new multi-step disable flow (warning → code → password → confirm → disable).
- DB migration: `User` fields `twoFactorEnabled` and `twoFactorSecret` added and migrated locally to persist per-user 2FA state.
- Appearance and theming: per-user `theme` persisted via `PUT /api/profile`, `ThemeInitializer` ensures `data-theme` on `<html>` pre-hydration for consistent previews and Snowfall activation.
- Snowfall: site-wide falling-snow visual component added and wired to theme detection so it activates for Christmas/Holly themes.
- Docs now render through `MarkdownRenderer` (Getting Started, API, Custom Domains, User Guide, ShareX, Flameshot) for consistent anchors, code fence styling, and link handling across docs/blog.
- Dashboard file grid UX: filters wrap and size correctly on mobile (full-width stack, tighter gaps), and the desktop search now starts collapsed and toggles open/closed via a search button for better readability.
- Commitlint for enforcing some sort of standard with commit messages.

### Changed (patch)
- Server-side password verification when disabling 2FA: DELETE `/api/profile/2fa` now requires account password and verifies with `bcrypt.compare` before clearing 2FA.
- Client robustness fixes: include credentials on profile/2fa fetches, unwrap API response envelope (`payload.data ?? payload`), visible fetch errors and debug logs to surface failures.
- Navigation & UI tweaks: `BaseNav` avatar now links to `/dashboard/profile` to match `UserNav`, mobile sheet trigger/footers improved, and modal z-index/overflow fixes.
- Navigation dropdown chevrons now animate/rotate on desktop for both base and dashboard navs.
- Updated knip configuration (incorrect entrypoints).
- Updated husky configs and lint-staged.

### Fixed (patch)
- Fixed broken JSX/parse error in `components/profile/security/profile-security.tsx` and restored a working client component.
- Fixed disable-modal not opening (modal nesting and button `type` issues resolved) and added a visible click debug counter during troubleshooting.
- Resolved "Loading QR…" / 2FA state mismatch by fetching secrets at the correct lifecycle point and adding an initial `Checking 2FA…` UI while profile loads.
- Exposed `updateProfile()` from profile hook to resolve `updateProfile is not a function` runtime error.
- Defensive guards and runtime checks added across profile/settings pages to prevent TypeErrors (e.g., safe access of `quotas`).
- Metadata robustness: Next metadata generation now validates inputs/base URLs, falls back to minimal metadata when data is missing/invalid, and avoids serialization crashes for embeds/OG cards.
- Video delivery: local storage provider routes video extensions (mp4/webm/mov/avi/mkv) through `/api/files` for range-friendly playback and honors host overrides for correct streaming URLs.


## [1.0.0-alpha.6] - 2025-12-16

### Added
- Snowfall site-wide visual: falling snow canvas that activates when a Christmas/Holly theme is in use (client canvas component + theme-aware detection).
- Per-user appearance settings: theme presets, hue overrides, live preview on the client, and persistence to the user's profile (`theme` stored on `User`).
- New server APIs and components:
  - Profile 2FA endpoints (`GET/POST/DELETE /api/profile/2fa`) to generate TOTP secrets and QR codes, verify tokens, enable and disable 2FA (server-side QR generation via `qrcode` + `otplib`).
  - Partners and Testimonials server APIs and admin UIs (partners CRUD, testimonial submission/management), plus homepage partners carousel wired to server data.
  - Profile Data Explorer: server `GET /api/profile` and a client JSON viewer for exporting/inspecting account data.
- UI components and client flows added: `ProfileAppearance` (appearance tab), `ThemeInitializer` client script, `Snowfall` component, 2FA UI scaffolding in profile security (temporarily blurred as "Coming soon").
- Prisma schema changes & migrations for new data models and fields: `Partner`, `Testimonial`, `twoFactorEnabled`, `twoFactorSecret`, and related migration files applied locally during development.
- Package additions for server-side 2FA/QRCodes: `otplib` and `qrcode`.

### Changed
- Theme propagation and client hydration: `data-theme` is now set on the `<html>` element and a small client initializer ensures the system/site theme is applied before React hydration so client-only features (Snowfall, previews) reliably reflect system-level site appearance.
- `hooks/use-profile.ts` now exposes `updateProfile()` and the profile API `PUT /api/profile` accepts `theme` and persists appearance changes.
- Navigation and header updates:
  - `BaseNav` aligned with `UserNav`: desktop avatar links directly to `/dashboard/profile`.
  - Mobile sheet trigger moved to the right and renders the signed-in user's avatar (falls back to menu icon when not signed in).
  - Mobile sections are toggleable and only the `base` section is open by default.
  - Mobile sheet now closes automatically on footer actions (Sign In/Register/Profile/Dashboard/Sign Out).
- Tabs, list UIs and dropdowns improved for better small-screen overflow and keyboard/outside-click behaviours (Radix primitives adopted for consistent focus management).
- Changelogs, partners, testimonials and ST5 pages refactored to use shared layout primitives (`PageShell`, `DashboardWrapper`) and improved responsive layouts.

### Fixed
- Defensive checks and runtime guards added to Settings, profile and other pages to prevent TypeErrors (e.g. attempting to access `quotas` on undefined objects).
- Admin role checks updated to treat `SUPERADMIN` equivalently to `ADMIN` where appropriate (settings/posts/admin routes and UIs).
- Resolved `updateProfile is not a function` by returning `updateProfile` from the profile hook the client uses.
- Snowfall visibility issues resolved by ensuring server-configured/system-level themes set `data-theme` on the document root and by improving Snowfall to observe both `data-theme` and document `className`.
- Prisma schema changes for 2FA and other models were added and migrations applied during development (see migrations folder).
- Misc layout and accessibility bug fixes across navs, modals, and small-screen components (modal scrolling, focus traps, dropdown outside-click behaviour, mobile overflow fixes).


## [1.0.0-alpha.5] - 2025-12-12

### Added
- Persisted partners to the database with a new `Partner` Prisma model and migration.
- Admin partner management UI (`/dashboard/partners`) with create/edit/delete and an empty-state.
- Server API routes for partners (`/api/partners` and `/api/partners/[id]`) supporting public GET and admin-protected create/update/delete.
- Homepage partners carousel wired to server data so partners can be surfaced dynamically.
 - New `Testimonial` Prisma model, migrations, and server APIs for public and admin operations (`/api/testimonials`).
 - Profile testimonial UI allowing users to submit, edit, archive, or delete a single testimonial from their profile.
 - Admin testimonial management in the dashboard with approve/hide/archive controls.
 - Public testimonial listing component with avatar support (image or initials fallback) and star-rating display.
 - Profile Data Explorer: added server GET for `/api/profile` and a client JSON viewer for exporting/inspecting account data.

### Changed
- Home page now fetches active partners server-side and conditionally renders the partners carousel.
- `components/partners/partners-carousel.tsx` refactored to accept server-driven `partners` props and fixed a JSX parsing bug.
- Navigation: added `Partners` admin link to both base and dashboard navigation.
- Error and Not Found pages standardized to use the site's fixed header (`BaseNav` / `DashboardNav` + `UserNav`), `DynamicBackground`, and a centered card layout for visual consistency.
- Dialog primitive and modals updated to cap height and enable internal scrolling for better mobile behavior; applied to edit/view user modals.
 - Standardized layout and theme across the site so pages use a consistent `PageShell` / `DashboardWrapper` composition with `BaseNav`, `DashboardNav`, `DynamicBackground`, and shared spacing/typography tokens.
 - Testimonial APIs updated to support `?mine=true` for fetching the current user's testimonial and admin `?all=true` for full lists.
 - Profile submit flow now enforces one testimonial per user (client shows Edit when a testimonial exists); POST creates only when no existing testimonial is present.
 - `components/testimonials` presentation refactored to use `Avatar` with initials fallback and a responsive card/grid layout.

### Fixed
- Guarded and unwrapped API responses in the dashboard partners list so `partners` is always an array (resolved `partners.map is not a function`).
- Fixed modal overflow on small screens so modals are scrollable and close controls remain accessible.
- Repaired a syntax/parse error in the partners carousel implementation.
- Various small layout and runtime fixes related to the partners integration and admin tooling.
 - Fixed client-side handling of API envelopes so `data === null` is not treated as an existing testimonial.
 - Added safe date parsing for testimonial `createdAt` to prevent display of `Invalid Date`.
 - Render testimonial ratings as star icons and added responsive button layout for mobile-friendly actions (submit/edit/delete/archive).
 - Resolved several runtime/hydration issues found while wiring testimonials and profile APIs (including Radix focus-group SSR fix and missing icon imports).


## [1.0.0-alpha.4] - 2025-12-12

### Added
- Public access for the pricing page via updated middleware constants.
- Navigation menus and dropdowns for both the main website and dashboard.
- Expanded analytics tracking for user actions and page visits.
- New analytics endpoints and improved dashboard analytics display.
 - `PageShell` applied across public pages (blog, docs, legal) for consistent header and content layout.
 - Table-style listing components used for blog, docs, and legal hub indexes for tighter, more readable lists.
 - New legal pages: Refund Policy and Service Level Agreement (SLA) with detailed policy text.
 - `DashboardWrapper` now supports a `nav` prop to choose between base and dashboard navigation contexts.

 - Analytics server routes: `overview`, `storage`, `top-items`, `top-users`, and `metrics/activity` providing timeseries, top-10 lists, and storage summaries.
 - Top users scoring & privacy model: primary + composite scoring (downloads + clicks, avg-per-file) and privacy-aware responses (anonymized distribution for non-admins, full list for admins).
 - Changelogs feature: server route `/api/changelogs` (GitHub releases fetch), `components/changelogs/ChangelogList.tsx`, and `/changelogs` page to list organizational releases (uses `react-markdown` for release bodies).
 - Recharts added for dashboard charts and visualizations.
 - Client UI components: `PageShell`, `DocsCard` (table-style), changelogs list with expandable rows and search, and analytics overview components.

### Changed
- Blog management layout now restricts post creation/management to admin users only.
- Refined analytics event structure and improved data consistency.
- Updated navigation logic for better user experience.
 - Main and dashboard navigation dropdowns converted to managed `DropdownMenu` primitives (replacing CSS hover groups) for reliable outside-click closing and keyboard interaction.
 - Public layout now uses a `ConditionalBaseNav` so the base navigation is only shown where appropriate; `DashboardWrapper` renders the dashboard header only when required.
 - Blog and docs index views refactored from card grids into the shared `Table` UI component.
 - Legal subpages refactored to use `PageShell` with compact left navigation and prose-based content; legal hub uses table rows and includes Refund and SLA links.

 - Docs layout: left TOC converted to a compact card for desktop and the mobile TOC toggle simplified to a small disclosure. `DocsToc` updated to hide on large screens in favor of the left card nav.
 - `PageShell` updated to integrate with `DashboardWrapper` so public pages show the same dynamic background and header as dashboard pages.
 - Changelogs page: moved to `DashboardWrapper`-backed layout for consistent background, and `ChangelogList` styling refactored to a compact table with expanders.
 - Added `react-markdown` and adjusted `package.json` to include the dependency (client-side markdown rendering in changelogs).

 - Navigation UX: `BaseNav` is now a fixed header so it scrolls consistently with the page; `ConditionalBaseNav` renders a spacer to prevent content overlap with the fixed header.
 - `DashboardNav` mobile sheet now includes a profile / auth footer area (sign in / register / profile / sign out) so account actions remain accessible on small screens.
 - Improved responsive nav behavior to prevent link overflow on smaller screens and to centralize nav rendering responsibilities.

### Fixed
- Navigation menu dropdowns.
- Various navigation and menu-related bugs.
- Fixed broken analytics event reporting and dashboard stats.
- Addressed issues with analytics data aggregation and display.
- Minor UI/UX bugs across dashboard and public pages.
 - Resolved duplicate/overlapping navigation rendering on public pages by centralizing base nav rendering and gating the dashboard header.
 - Desktop dropdowns now reliably auto-close on outside click and behave consistently across pages.
 - Fixed several small layout regressions introduced during nav and hero refactors.

  - Fixed base navigation overlap by making the base header fixed and adding a spacer via `ConditionalBaseNav`.
  - Added mobile sheet footer to `DashboardNav` to surface auth/profile actions and prevent layout overflow.
  - Resolved additional responsive overflow issues for dashboard nav links on narrow viewports.

 - Fixed duplicate variable declarations and hook-order issues introduced during iterative changes (`TopUsers.tsx`, `top-users` route, and `ChangelogList.tsx`).
 - Corrected top-users scoring inconsistency by introducing `compositeScore` weighting to account for `filesCount` so users with many files do not score lower unfairly.
 - Fixed a Hook ordering bug in `ChangelogList.tsx` so expand state is declared before early returns.
 - Various build fixes and runtime stability improvements encountered while wiring the new pages and APIs.


## [1.0.0-alpha.3] - 2025-12-11

### Added
- New Stranger Things 5 hub page with themed visuals, countdowns, and facts.
- `Comments` feature for the ST5 page: users can post comments with attachments (images/GIFs), mark spoilers, and admins can hide comments.
- `Hawkins Neon` theme preset added to the theme customizer.
- Pricing page improvements: server-rendered pricing page, AddOn checkout UI, and active-plan detection.
- Stripe integration: webhook route and Discord forwarding support.
- `Contact` page (links-first) and `ContactInfo` component.
- Reworked file upload flow and attachments API to support preview URLs and safer client uploads.
- Support for image/GIF attachments in comments with spoiler flag handling.

### Changed
- Refactored ST5 page layout into a three-column grid (countdowns + info left, facts right).
- Repaired and standardized the Countdown component sizing and layout.
- Moved interactive add-on quantity controls into a client `AddOnCheckout` component.
- Pricing CTA alignment and active-plan button states updated.
- Reworked S3 storage provider connector: multipart uploads, signed URL generation, and cleaner env-driven provider selection.
- Custom domains subsystem fixes and DNS alias handling improved (validation, mapping, and edge-case handling).
- Files API validation improved (content-type/size checks) and storage records better integrated with comment attachments.

### Database
- Prisma schema updated: extended `St5Comment` with `isHidden` and `isSpoiler`, added `St5CommentAttachment` model.
- NOTE: Run `prisma migrate` to apply schema changes locally before using the new comments endpoints.
- Additional migrations added to support attachments and moderation fields. Run:
  ```bash
  bunx prisma migrate dev --name add_st5_comment_fields
  ```
- Confirm `St5CommentAttachment` and `File` tables exist after migration.

### Fixed
- Various layout and build issues (including a parse error in `Countdown.tsx` repaired).
- Fixed a build-breaking parse error in `components/st5/Countdown.tsx` and removed/merged temporary fallback components.
- Fixed several domain-related edge-cases that affected custom domain provisioning and SSL assignment.
- Resolved issues with S3 uploads that caused broken previews for certain file types.

### Removed
- Contact form and `/api/contact` route replaced with links-first contact page.
- Temporary development artifacts (e.g., `CountdownFixed.tsx`) consolidated or removed as part of cleanup.

---

For full details and developer notes see `RECENT_CHANGES.md` and `ST5_PAGE_THEME.md`.
