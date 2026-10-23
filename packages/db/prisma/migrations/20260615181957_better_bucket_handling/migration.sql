-- DropIndex
DROP INDEX "StorageBucket_stripeSubscriptionId_idx";

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "storageBucketId" TEXT;

-- AlterTable
ALTER TABLE "StorageBucket" ADD COLUMN     "fileCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isCore" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "File_storageBucketId_idx" ON "File"("storageBucketId");

-- CreateIndex
CREATE INDEX "StorageBucket_isCore_idx" ON "StorageBucket"("isCore");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_storageBucketId_fkey" FOREIGN KEY ("storageBucketId") REFERENCES "StorageBucket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
