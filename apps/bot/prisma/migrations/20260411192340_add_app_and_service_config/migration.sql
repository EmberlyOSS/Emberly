-- CreateTable
CREATE TABLE "app_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "guild_ids" TEXT,
    "dev_ids" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "vps_servers" TEXT,
    "game_servers" TEXT,
    "client_services" TEXT,
    "web_services" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_config_pkey" PRIMARY KEY ("id")
);
