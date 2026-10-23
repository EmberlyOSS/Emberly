/*
  Warnings:

  - You are about to drop the column `vultrBucketName` on the `StorageBucket` table. All the data in the column will be lost.
  - You are about to drop the column `vultrObjectStorageId` on the `StorageBucket` table. All the data in the column will be lost.
  - You are about to drop the `VultrObjectStorage` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[poolBucketName]` on the table `StorageBucket` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "StorageBucket" DROP CONSTRAINT "StorageBucket_vultrObjectStorageId_fkey";

-- DropIndex
DROP INDEX "StorageBucket_vultrBucketName_key";

-- DropIndex
DROP INDEX "StorageBucket_vultrObjectStorageId_idx";

-- AlterTable
ALTER TABLE "StorageBucket" DROP COLUMN "vultrBucketName",
DROP COLUMN "vultrObjectStorageId",
ADD COLUMN     "objectStoragePoolId" TEXT,
ADD COLUMN     "poolBucketName" TEXT;

-- DropTable
DROP TABLE "VultrObjectStorage";

-- CreateTable
CREATE TABLE "ObjectStoragePool" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "s3Hostname" TEXT NOT NULL,
    "s3AccessKey" TEXT NOT NULL,
    "s3SecretKey" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "cfHostname" TEXT,
    "cfDnsRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObjectStoragePool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ObjectStoragePool_provider_idx" ON "ObjectStoragePool"("provider");

-- CreateIndex
CREATE INDEX "ObjectStoragePool_region_idx" ON "ObjectStoragePool"("region");

-- CreateIndex
CREATE INDEX "ObjectStoragePool_status_idx" ON "ObjectStoragePool"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ObjectStoragePool_provider_externalId_key" ON "ObjectStoragePool"("provider", "externalId");

-- CreateIndex
CREATE INDEX "StorageBucket_objectStoragePoolId_idx" ON "StorageBucket"("objectStoragePoolId");

-- CreateIndex
CREATE UNIQUE INDEX "StorageBucket_poolBucketName_key" ON "StorageBucket"("poolBucketName");

-- AddForeignKey
ALTER TABLE "StorageBucket" ADD CONSTRAINT "StorageBucket_objectStoragePoolId_fkey" FOREIGN KEY ("objectStoragePoolId") REFERENCES "ObjectStoragePool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
