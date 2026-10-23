-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "message_id" TEXT,
    "author_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'announcement',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "color" INTEGER NOT NULL DEFAULT 3447003,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcements_guild_id_idx" ON "announcements"("guild_id");

-- CreateIndex
CREATE INDEX "announcements_channel_id_idx" ON "announcements"("channel_id");

-- CreateIndex
CREATE INDEX "announcements_author_id_idx" ON "announcements"("author_id");
