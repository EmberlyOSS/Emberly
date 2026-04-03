-- DropTable: Remove docs and ST5 tables (no longer used)

-- Drop ST5 tables (order matters due to foreign keys)
DROP TABLE IF EXISTS "St5CommentAttachment" CASCADE;
DROP TABLE IF EXISTS "St5CommentReaction" CASCADE;
DROP TABLE IF EXISTS "St5CommentReply" CASCADE;
DROP TABLE IF EXISTS "St5Comment" CASCADE;

-- Drop DocPage table
DROP TABLE IF EXISTS "DocPage" CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "DocCategory" CASCADE;
DROP TYPE IF EXISTS "DocStatus" CASCADE;
