-- CreateTable
CREATE TABLE "St5Comment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "St5Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "St5Comment_userId_idx" ON "St5Comment"("userId");

-- CreateIndex
CREATE INDEX "St5Comment_createdAt_idx" ON "St5Comment"("createdAt");

-- AddForeignKey
ALTER TABLE "St5Comment" ADD CONSTRAINT "St5Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
