-- CreateTable
CREATE TABLE "level_configs" (
    "id" SERIAL NOT NULL,
    "guild_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "max_level" INTEGER NOT NULL DEFAULT 10,
    "base_threshold" INTEGER NOT NULL DEFAULT 100,
    "exponent_factor" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "decay_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "inactivity_days" INTEGER NOT NULL DEFAULT 7,
    "level_role_ids" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "level_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_levels" (
    "id" SERIAL NOT NULL,
    "guild_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "activity_points" INTEGER NOT NULL DEFAULT 0,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "reaction_count" INTEGER NOT NULL DEFAULT 0,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "level_configs_guild_id_key" ON "level_configs"("guild_id");

-- CreateIndex
CREATE INDEX "user_levels_guild_id_idx" ON "user_levels"("guild_id");

-- CreateIndex
CREATE INDEX "user_levels_user_id_idx" ON "user_levels"("user_id");

-- CreateIndex
CREATE INDEX "user_levels_level_idx" ON "user_levels"("level");

-- CreateIndex
CREATE UNIQUE INDEX "user_levels_guild_id_user_id_key" ON "user_levels"("guild_id", "user_id");
