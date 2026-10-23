/*
  Warnings:

  - You are about to drop the `service_config` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "service_config";

-- CreateTable
CREATE TABLE "linked_emberly_accounts" (
    "id" SERIAL NOT NULL,
    "discord_id" TEXT NOT NULL,
    "upload_token" TEXT NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linked_emberly_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linked_emberly_accounts_discord_id_key" ON "linked_emberly_accounts"("discord_id");
