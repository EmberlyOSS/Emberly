-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'IMPERSONATION', 'ABUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('STAFF', 'PARTNER', 'VERIFICATION', 'BAN_APPEAL');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banExpiresAt" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banType" TEXT,
ADD COLUMN     "bannedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserBan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'permanent',
    "expiresAt" TIMESTAMP(3),
    "liftedAt" TIMESTAMP(3),
    "liftedById" TEXT,
    "liftReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
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

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "answers" JSONB NOT NULL,
    "notes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserBan_userId_idx" ON "UserBan"("userId");

-- CreateIndex
CREATE INDEX "UserBan_createdAt_idx" ON "UserBan"("createdAt");

-- CreateIndex
CREATE INDEX "UserReport_reportedUserId_idx" ON "UserReport"("reportedUserId");

-- CreateIndex
CREATE INDEX "UserReport_status_idx" ON "UserReport"("status");

-- CreateIndex
CREATE INDEX "UserReport_createdAt_idx" ON "UserReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserReport_reportedUserId_reporterUserId_key" ON "UserReport"("reportedUserId", "reporterUserId");

-- CreateIndex
CREATE INDEX "Application_userId_idx" ON "Application"("userId");

-- CreateIndex
CREATE INDEX "Application_type_status_idx" ON "Application"("type", "status");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");

-- AddForeignKey
ALTER TABLE "UserBan" ADD CONSTRAINT "UserBan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBan" ADD CONSTRAINT "UserBan_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
