-- AlterTable
ALTER TABLE "guild_configs" ADD COLUMN     "verification_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verification_role_ids" TEXT,
ADD COLUMN     "verification_source_guild_id" TEXT;
