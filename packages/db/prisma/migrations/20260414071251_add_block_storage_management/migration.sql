-- AlterTable
ALTER TABLE "StorageBucket" ADD COLUMN     "provisionStatus" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "vultrBucketName" TEXT,
ADD COLUMN     "vultrObjectStorageId" TEXT;

-- CreateTable
CREATE TABLE "VultrObjectStorage" (
    "id" TEXT NOT NULL,
    "vultrId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "clusterId" INTEGER NOT NULL,
    "s3Hostname" TEXT NOT NULL,
    "s3AccessKey" TEXT NOT NULL,
    "s3SecretKey" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VultrObjectStorage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VultrObjectStorage_vultrId_key" ON "VultrObjectStorage"("vultrId");

-- CreateIndex
CREATE INDEX "VultrObjectStorage_region_idx" ON "VultrObjectStorage"("region");

-- CreateIndex
CREATE INDEX "VultrObjectStorage_status_idx" ON "VultrObjectStorage"("status");

-- CreateIndex
CREATE INDEX "StorageBucket_vultrObjectStorageId_idx" ON "StorageBucket"("vultrObjectStorageId");

-- CreateIndex
CREATE INDEX "StorageBucket_stripeSubscriptionId_idx" ON "StorageBucket"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "StorageBucket" ADD CONSTRAINT "StorageBucket_vultrObjectStorageId_fkey" FOREIGN KEY ("vultrObjectStorageId") REFERENCES "VultrObjectStorage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
