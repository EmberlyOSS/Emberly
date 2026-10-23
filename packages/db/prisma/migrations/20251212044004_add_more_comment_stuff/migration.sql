-- AlterTable
ALTER TABLE "St5Comment" ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSpoiler" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "St5CommentAttachment" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "St5CommentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "St5CommentAttachment_commentId_idx" ON "St5CommentAttachment"("commentId");

-- CreateIndex
CREATE INDEX "St5CommentAttachment_fileId_idx" ON "St5CommentAttachment"("fileId");

-- AddForeignKey
ALTER TABLE "St5CommentAttachment" ADD CONSTRAINT "St5CommentAttachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "St5Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "St5CommentAttachment" ADD CONSTRAINT "St5CommentAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
