-- Moderation, logging, tickets and per-server settings moved to Warden (emberly-mod-bot),
-- which keeps no database. These tables are no longer used by the Emberly bot.
DROP TABLE IF EXISTS "moderation_logs";
DROP TABLE IF EXISTS "warnings";
DROP TABLE IF EXISTS "tickets";
DROP TABLE IF EXISTS "transcripts";
DROP TABLE IF EXISTS "guild_configs";
