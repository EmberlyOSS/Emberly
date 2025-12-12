# Changelog (updated)

All notable changes to this project will be documented in this file.

The format is based on "Keep a Changelog" and follows [Semantic Versioning](https://semver.org/).

## [Unreleased]



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

### Changed
- Blog management layout now restricts post creation/management to admin users only.
- Refined analytics event structure and improved data consistency.
- Updated navigation logic for better user experience.
 - Main and dashboard navigation dropdowns converted to managed `DropdownMenu` primitives (replacing CSS hover groups) for reliable outside-click closing and keyboard interaction.
 - Public layout now uses a `ConditionalBaseNav` so the base navigation is only shown where appropriate; `DashboardWrapper` renders the dashboard header only when required.
 - Blog and docs index views refactored from card grids into the shared `Table` UI component.
 - Legal subpages refactored to use `PageShell` with compact left navigation and prose-based content; legal hub uses table rows and includes Refund and SLA links.

### Fixed
- Navigation menu dropdowns.
- Various navigation and menu-related bugs.
- Fixed broken analytics event reporting and dashboard stats.
- Addressed issues with analytics data aggregation and display.
- Minor UI/UX bugs across dashboard and public pages.
 - Resolved duplicate/overlapping navigation rendering on public pages by centralizing base nav rendering and gating the dashboard header.
 - Desktop dropdowns now reliably auto-close on outside click and behave consistently across pages.
 - Fixed several small layout regressions introduced during nav and hero refactors.


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
