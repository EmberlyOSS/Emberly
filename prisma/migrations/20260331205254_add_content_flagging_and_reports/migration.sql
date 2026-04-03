-- CreateEnum
CREATE TYPE "ContentReportType" AS ENUM ('FILE', 'URL');

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "flagReason" TEXT,
ADD COLUMN     "flagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "flaggedAt" TIMESTAMP(3),
ADD COLUMN     "flaggedById" TEXT;

-- AlterTable
ALTER TABLE "ShortenedUrl" ADD COLUMN     "flagReason" TEXT,
ADD COLUMN     "flagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "flaggedAt" TIMESTAMP(3),
ADD COLUMN     "flaggedById" TEXT;

-- CreateTable
CREATE TABLE "ContentReport" (
    "id" TEXT NOT NULL,
    "contentType" "ContentReportType" NOT NULL,
    "fileId" TEXT,
    "urlId" TEXT,
    "reporterUserId" TEXT NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentReport_fileId_idx" ON "ContentReport"("fileId");

-- CreateIndex
CREATE INDEX "ContentReport_urlId_idx" ON "ContentReport"("urlId");

-- CreateIndex
CREATE INDEX "ContentReport_status_idx" ON "ContentReport"("status");

-- CreateIndex
CREATE INDEX "ContentReport_createdAt_idx" ON "ContentReport"("createdAt");

-- CreateIndex
CREATE INDEX "File_flagged_idx" ON "File"("flagged");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_flaggedById_fkey" FOREIGN KEY ("flaggedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortenedUrl" ADD CONSTRAINT "ShortenedUrl_flaggedById_fkey" FOREIGN KEY ("flaggedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "ShortenedUrl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
