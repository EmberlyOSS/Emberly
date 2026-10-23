-- CreateTable
CREATE TABLE "guild_configs" (
    "id" SERIAL NOT NULL,
    "guild_id" TEXT NOT NULL,
    "logs_channel_id" TEXT,
    "ticket_channel_id" TEXT,
    "ticket_log_channel_id" TEXT,
    "support_role_id" TEXT,
    "member_role_id" TEXT,
    "welcome_channel_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guild_configs_guild_id_key" ON "guild_configs"("guild_id");
