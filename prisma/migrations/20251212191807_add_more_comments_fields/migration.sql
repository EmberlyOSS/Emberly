-- CreateTable
CREATE TABLE "St5CommentReply" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "St5CommentReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "St5CommentReaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "St5CommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "St5CommentReply_commentId_idx" ON "St5CommentReply"("commentId");

-- CreateIndex
CREATE INDEX "St5CommentReply_userId_idx" ON "St5CommentReply"("userId");

-- CreateIndex
CREATE INDEX "St5CommentReaction_commentId_idx" ON "St5CommentReaction"("commentId");

-- CreateIndex
CREATE INDEX "St5CommentReaction_userId_idx" ON "St5CommentReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "St5CommentReaction_commentId_userId_key" ON "St5CommentReaction"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "St5CommentReply" ADD CONSTRAINT "St5CommentReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "St5CommentReply" ADD CONSTRAINT "St5CommentReply_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "St5Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "St5CommentReaction" ADD CONSTRAINT "St5CommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "St5CommentReaction" ADD CONSTRAINT "St5CommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "St5Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
