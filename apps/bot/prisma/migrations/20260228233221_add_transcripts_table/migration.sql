-- CreateTable
CREATE TABLE "transcripts" (
    "id" SERIAL NOT NULL,
    "guild_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transcripts_ticket_id_key" ON "transcripts"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "transcripts_slug_key" ON "transcripts"("slug");

-- CreateIndex
CREATE INDEX "transcripts_guild_id_idx" ON "transcripts"("guild_id");

-- CreateIndex
CREATE INDEX "transcripts_slug_idx" ON "transcripts"("slug");

-- CreateIndex
CREATE INDEX "transcripts_user_id_idx" ON "transcripts"("user_id");
