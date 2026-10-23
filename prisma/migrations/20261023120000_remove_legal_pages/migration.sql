-- Legal documents are now served statically from packages/lib/legal/documents.ts

-- DropTable (also drops its foreign key and indexes)
DROP TABLE IF EXISTS "LegalPage";

-- DropEnum
DROP TYPE IF EXISTS "LegalStatus";
