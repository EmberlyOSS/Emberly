-- Licenses are now managed by the separate Emberly Licensing service.
DROP TABLE IF EXISTS "License";

UPDATE "Product" SET "active" = false WHERE "slug" IN ('license-white-label', 'license-hosting');
