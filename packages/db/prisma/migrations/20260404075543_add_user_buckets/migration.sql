-- AlterTable
ALTER TABLE "NexiumSquad" ADD COLUMN     "storageBucketId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "storageBucketId" TEXT;

-- CreateTable
CREATE TABLE "StorageBucket" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 's3',
    "s3Bucket" TEXT NOT NULL DEFAULT '',
    "s3Region" TEXT NOT NULL DEFAULT '',
    "s3AccessKeyId" TEXT NOT NULL DEFAULT '',
    "s3SecretKey" TEXT NOT NULL DEFAULT '',
    "s3Endpoint" TEXT,
    "s3ForcePathStyle" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorageBucket_provider_idx" ON "StorageBucket"("provider");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_storageBucketId_fkey" FOREIGN KEY ("storageBucketId") REFERENCES "StorageBucket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NexiumSquad" ADD CONSTRAINT "NexiumSquad_storageBucketId_fkey" FOREIGN KEY ("storageBucketId") REFERENCES "StorageBucket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
